import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, ShoppingCart, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem } from "@shared/schema";

interface OrderItem {
  itemId: number;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
}

export function OrderForm() {
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");

  const { data: inventoryItems } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: { username: string; items: OrderItem[]; totalAmount: number }) => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      if (!response.ok) throw new Error("Failed to create order");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      setOrderItems([]);
      toast({ title: "Successo", description: "Ordine completato con successo!" });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile completare l'ordine",
        variant: "destructive",
      });
    },
  });

  const addItemToOrder = () => {
    if (!selectedItem || quantity <= 0) return;

    const item = inventoryItems?.find((i) => i.name === selectedItem);
    if (!item) return;

    if (item.quantity < quantity) {
      toast({
        title: "Scorte insufficienti",
        description: `Solo ${item.quantity} pezzi disponibili di ${item.name}`,
        variant: "destructive",
      });
      return;
    }

    const price = parseFloat(item.purchase_price as unknown as string); // 👈 cast sicuro
    const existingItem = orderItems.find((i) => i.itemId === item.id);

    if (existingItem) {
      setOrderItems((prev) =>
        prev.map((i) =>
          i.itemId === item.id
            ? { ...i, quantity: i.quantity + quantity, total: i.total + price * quantity }
            : i
        )
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          itemId: item.id,
          itemName: item.name,
          quantity,
          price,
          total: price * quantity,
        },
      ]);
    }

    setQuantity(1);
    setSelectedItem("");
  };

  const removeItemFromOrder = (itemId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.itemId !== itemId));
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

  const completeOrder = async () => {
    if (orderItems.length === 0) return;

    // Non aggiorniamo più l'inventario qui - lo fa la stored procedure
    createOrderMutation.mutate({
      username: currentUser.username,
      items: orderItems,
      totalAmount,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-6 h-6" />
          Nuovo Ordine
        </CardTitle>
        <CardDescription>
          Crea un nuovo ordine e sottrai automaticamente i pezzi dall'inventario
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Item Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Seleziona Pezzo</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Scegli un pezzo" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems?.map((item) => (
                    <SelectItem key={item.id} value={item.name}>
                      {item.name} ({item.quantity} disponibili)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantità</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <Button onClick={addItemToOrder} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Aggiungi all'Ordine
          </Button>

          {orderItems.length > 0 && (
            <div className="space-y-3">
              <Label>Articoli nell'Ordine</Label>
              {orderItems.map((item) => (
                <div key={item.itemId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x €{item.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>€{item.total.toFixed(2)}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => removeItemFromOrder(item.itemId)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold">Totale:</span>
                <Badge variant="secondary" className="text-lg">
                  €{totalAmount.toFixed(2)}
                </Badge>
              </div>

              <Button onClick={completeOrder} className="w-full" disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? "Elaborazione..." : "Completa Ordine"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
