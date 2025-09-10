import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Modification } from "@shared/schema";

export function ActivityFeed() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const { toast } = useToast();

  const { data: activities, isLoading } = useQuery<any[]>({
    queryKey: ['/api/activities'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const fetchOrderDetails = async (orderId: number) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order details');
      const orderDetails = await response.json();
      setSelectedOrder(orderDetails);
      setOrderDetailsOpen(true);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i dettagli dell'ordine",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card p-6 rounded-xl border border-border" data-testid="activity-feed-loading">
        <h2 className="text-xl font-semibold mb-4">Attività Recente</h2>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getActivityColor = (index: number) => {
    const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500'];
    return colors[index % colors.length];
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ora';
    if (diffInMinutes < 60) return `${diffInMinutes} minuti fa`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ore fa`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} giorni fa`;
  };

  return (
    <div className="bg-card p-6 rounded-xl border border-border" data-testid="activity-feed">
      <h2 className="text-xl font-semibold mb-4" data-testid="activity-feed-title">Attività Recente</h2>
      <div className="space-y-4">
        {activities && activities.length > 0 ? (
          activities.slice(0, 10).map((activity, index) => {
            return (
              <div key={`${activity.type}-${activity.id}`} className="flex items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`activity-item-${index}`}>
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-2 h-2 ${getActivityColor(index)} rounded-full mt-2`}></div>
                  <div className="flex-1">
                    <p className="text-sm" data-testid={`activity-description-${index}`}>
                      <span className="font-medium">{activity.username || activity.full_name || 'Sistema'}</span> {activity.type === 'order' ? 'ha creato un ordine' : activity.type === 'restock' ? 'ha fatto restock di' : activity.quantity < 0 ? 'ha sottratto' : 'ha installato'}{' '}
                      <span className="text-primary">{activity.item_name}</span>
                      {Math.abs(activity.quantity) > 1 && ` (${Math.abs(activity.quantity)} pz)`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground" data-testid={`activity-time-${index}`}>
                        {activity.created_at ? formatTimeAgo(new Date(activity.created_at)) : 'Data sconosciuta'}
                      </p>
                      {activity.type === 'order' && activity.reference_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                          onClick={() => fetchOrderDetails(activity.reference_id)}
                        >
                          Dettagli
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                {activity.total_cost && activity.type === 'order' && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      €{parseFloat(activity.total_cost).toFixed(2)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Totale ordine
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center text-muted-foreground py-8" data-testid="activity-empty-state">
            <div className="flex flex-col items-center gap-2">
              <p className="text-lg">📊 Nessuna attività recente</p>
              <p className="text-sm">Le attività appariranno qui quando creerai ordini o modifiche all'inventario</p>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Dialog */}
      <Dialog open={orderDetailsOpen} onOpenChange={setOrderDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Dettagli Ordine #{selectedOrder?.order?.id}</DialogTitle>
            <DialogDescription>
              Informazioni complete sull'ordine e pagamento dipendente
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Header con informazioni principali */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">👤 Dipendente</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{selectedOrder.employee?.full_name}</p>
                    <p className="text-muted-foreground">@{selectedOrder.employee?.username}</p>
                    <Badge variant={selectedOrder.employee?.role === 'admin' ? 'default' : 'secondary'}>
                      {selectedOrder.employee?.role === 'admin' ? 'Admin' : 'Dipendente'}
                    </Badge>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">📅 Ordine</h4>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{new Date(selectedOrder.order?.created_at).toLocaleDateString()}</p>
                    <p className="text-muted-foreground">{new Date(selectedOrder.order?.created_at).toLocaleTimeString()}</p>
                    <Badge variant="outline">{selectedOrder.order?.status}</Badge>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">💰 Pagamento</h4>
                  <div className="text-2xl font-bold text-green-600">
                    €{selectedOrder.employeePayment?.toFixed(2)}
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Da pagare al dipendente
                  </p>
                </div>
              </div>

              {/* Riepilogo ordine */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-3">📊 Riepilogo Ordine</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{selectedOrder.items?.length || 0}</div>
                    <p className="text-sm text-yellow-700">Articoli</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{selectedOrder.order?.total_quantity || 0}</div>
                    <p className="text-sm text-yellow-700">Pezzi Totali</p>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">€{selectedOrder.order?.total_amount?.toFixed(2) || '0.00'}</div>
                    <p className="text-sm text-yellow-700">Valore Totale</p>
                  </div>
                </div>
              </div>

              {/* Dettagli articoli */}
              <div>
                <h4 className="font-medium mb-3">🛍️ Articoli Ordinati</h4>
                <div className="border rounded-lg overflow-hidden">
                  {selectedOrder.items?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-lg">{item.item_name}</p>
                        <p className="text-sm text-muted-foreground">Quantità: {item.quantity} pezzi</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">€{parseFloat(item.unit_price).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">per pezzo</p>
                        <p className="text-lg font-bold text-green-600">€{parseFloat(item.total_cost).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">totale</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer con totale */}
              <div className="bg-green-100 p-4 rounded-lg border-2 border-green-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-green-800">💵 Totale Ordine</h4>
                    <p className="text-sm text-green-700">Valore complessivo dell'ordine</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600">
                      €{selectedOrder.order?.total_amount?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setOrderDetailsOpen(false)}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}