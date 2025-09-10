import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Package, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Employee, InventoryItem } from "@shared/schema";

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState("users");
  const [newItem, setNewItem] = useState({
    name: "",
    category: "upper",
    type: "motore",
    quantity: 0,
    min_stock: 5,
    purchase_price: 0
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ['/api/employees'],
    queryFn: async () => {
      const res = await fetch('/api/employees');
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json() as Promise<Employee[]>;
    },
  });

  const { data: inventoryItems } = useQuery<InventoryItem[]>({
    queryKey: ['/api/inventory'],
    queryFn: async () => {
      const res = await fetch('/api/inventory');
      if (!res.ok) throw new Error('Failed to fetch inventory');
      return res.json() as Promise<InventoryItem[]>;
    },
  });

  const { data: todaysDeductions } = useQuery<{ username: string; total: number }[]>({
    queryKey: ['/api/deductions/today'],
    queryFn: async () => {
      const res = await fetch('/api/deductions/today');
      if (!res.ok) throw new Error('Failed to fetch deductions');
      return res.json() as Promise<{ username: string; total: number }[]>;
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ username, updates }: { username: string; updates: Partial<Employee> }) => {
      const response = await fetch(`/api/employees/${username}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update employee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
      toast({ title: "Utente aggiornato", description: "Ruolo aggiornato con successo" });
    },
  });

  const addInventoryMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await fetch(`/api/inventory/${id}/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error('Failed to add inventory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({ title: "Inventario aggiornato", description: "Quantità aggiunta con successo" });
    },
  });

  const createInventoryMutation = useMutation({
    mutationFn: async (item: any) => {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      if (!response.ok) throw new Error('Failed to create item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      setNewItem({ name: "", category: "upper", type: "motore", quantity: 0, min_stock: 5, purchase_price: 0 });
      toast({ title: "Articolo creato", description: "Nuovo articolo aggiunto all'inventario" });
    },
  });

  const resetDeductionsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/deductions/reset', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to reset deductions');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deductions/today'] });
      toast({ title: "Deduzioni reset", description: "Deduzioni giornaliere resettate" });
    },
  });

  const updateEmployeeRole = (username: string, role: string) => {
    updateEmployeeMutation.mutate({ username, updates: { role } });
  };

  const addInventory = (id: string, quantity: number) => {
    addInventoryMutation.mutate({ id, quantity });
  };

  const createInventoryItem = () => {
    createInventoryMutation.mutate(newItem);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Utenti
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="w-4 h-4 mr-2" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="finances">
            <CreditCard className="w-4 h-4 mr-2" />
            Finanze
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Gestione Utenti</CardTitle>
              <CardDescription>Gestisci i ruoli e le autorizzazioni degli utenti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees?.map((employee) => (
                  <div key={employee.username} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{employee.full_name}</p>
                      <p className="text-sm text-muted-foreground">@{employee.username}</p>
                    </div>
                    <Select
                      value={employee.role}
                      onValueChange={(value) => updateEmployeeRole(employee.username, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Dipendente</SelectItem>
                        <SelectItem value="admin">Amministratore</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Aggiungi Quantità</CardTitle>
                <CardDescription>Aggiungi pezzi all'inventario esistente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inventoryItems?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Disponibili: {item.quantity}</p>
                      </div>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Quantità"
                        className="w-20"
                        onChange={(e) => addInventory(item.id.toString(), parseInt(e.target.value) || 0)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Nuovo Articolo</CardTitle>
                <CardDescription>Crea un nuovo articolo nell'inventario</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Nome Articolo"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upper">Superiore</SelectItem>
                        <SelectItem value="lower">Inferiore</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={newItem.type} onValueChange={(value) => setNewItem({ ...newItem, type: value })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="motore">Motore</SelectItem>
                        <SelectItem value="trasmissione">Trasmissione</SelectItem>
                        <SelectItem value="batteria">Batteria</SelectItem>
                        <SelectItem value="olio">Olio</SelectItem>
                        <SelectItem value="sospensioni">Sospensioni</SelectItem>
                        <SelectItem value="gomme">Gomme</SelectItem>
                        <SelectItem value="freni">Freni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 0 })}
                      placeholder="Quantità Iniziale"
                    />
                    <Input
                      type="number"
                      value={newItem.min_stock}
                      onChange={(e) => setNewItem({ ...newItem, min_stock: parseInt(e.target.value) || 5 })}
                      placeholder="Scorta Minima"
                    />
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.purchase_price}
                    onChange={(e) => setNewItem({ ...newItem, purchase_price: parseFloat(e.target.value) || 0 })}
                    placeholder="Prezzo di Acquisto (€)"
                  />
                  <Button onClick={createInventoryItem} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Crea Articolo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finances">
          <Card>
            <CardHeader>
              <CardTitle>Deduzioni Giornaliere</CardTitle>
              <CardDescription>Totale deduzioni da pagare oggi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysDeductions?.map((deduction) => (
                  <div key={deduction.username} className="flex items-center justify-between p-4 border rounded-lg">
                    <p className="font-medium">{deduction.username}</p>
                    <Badge variant="destructive" className="text-lg">€{deduction.total.toFixed(2)}</Badge>
                  </div>
                ))}
                <Button onClick={() => resetDeductionsMutation.mutate()} variant="outline" className="w-full">
                  Reset Deduzioni Giornaliere
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
