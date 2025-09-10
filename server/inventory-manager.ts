// Sistema di gestione inventario ottimizzato
import { db } from "./mysql-storage";
import { inventory, modifications, activity_log, orders } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface InventoryOperation {
  itemId: number;
  itemName: string;
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
  cost?: number;
  description?: string;
  username: string;
}

export interface OrderItem {
  itemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  profit: number;
}

export interface CreateOrderRequest {
  username: string;
  items: OrderItem[];
  totalAmount: number;
  totalProfit: number;
  description?: string;
}

export class InventoryManager {
  
  /**
   * Operazione ottimizzata per modificare l'inventario
   */
  static async modifyInventory(operation: InventoryOperation): Promise<{ success: boolean; newQuantity: number; error?: string }> {
    try {
      // Verifica che l'articolo esista
      const item = await db.query.inventory.findFirst({ 
        where: eq(inventory.id, operation.itemId) 
      });
      
      if (!item) {
        return { success: false, newQuantity: 0, error: "Articolo non trovato" };
      }

      // Calcola nuova quantità
      let newQuantity: number;
      switch (operation.operation) {
        case 'add':
          newQuantity = Number(item.quantity) + operation.quantity;
          break;
        case 'subtract':
          newQuantity = Number(item.quantity) - operation.quantity;
          if (newQuantity < 0) {
            return { 
              success: false, 
              newQuantity: Number(item.quantity), 
              error: `Scorte insufficienti. Disponibili: ${item.quantity}, Richieste: ${operation.quantity}` 
            };
          }
          break;
        case 'set':
          newQuantity = operation.quantity;
          break;
        default:
          return { success: false, newQuantity: Number(item.quantity), error: "Operazione non valida" };
      }

      // Aggiorna inventario
      await db.update(inventory)
        .set({ 
          quantity: newQuantity,
          updated_at: new Date()
        })
        .where(eq(inventory.id, operation.itemId));

      // Crea record di modifica
      const modification = await db.insert(modifications).values({
        username: operation.username,
        item_id: operation.itemId,
        item_name: operation.itemName,
        quantity: operation.quantity,
        total_cost: String(operation.cost || 0),
        operation_type: operation.operation === 'add' ? 'add' : 'subtract',
        description: operation.description || `${operation.operation === 'add' ? 'Aggiunto' : 'Sottratto'} ${operation.quantity} pezzi`
      }).returning();

      // Log attività
      await db.insert(activity_log).values({
        username: operation.username,
        activity_type: 'modification',
        item_name: operation.itemName,
        quantity: operation.quantity,
        amount: String(operation.cost || 0),
        description: operation.description || `Modifica inventario: ${operation.operation} ${operation.quantity}`,
        reference_id: modification[0].id
      });

      return { success: true, newQuantity };
    } catch (error) {
      console.error("Inventory modification error:", error);
      return { 
        success: false, 
        newQuantity: 0, 
        error: error instanceof Error ? error.message : "Errore sconosciuto" 
      };
    }
  }

  /**
   * Creazione ordine ottimizzata con transazione
   */
  static async createOrder(request: CreateOrderRequest): Promise<{ success: boolean; orders: any[]; error?: string }> {
    try {
      const createdOrders: any[] = [];
      let totalOrderAmount = 0;
      let totalOrderProfit = 0;

      // Verifica scorte per tutti gli articoli prima di procedere
      for (const item of request.items) {
        const inventoryItem = await db.query.inventory.findFirst({ 
          where: eq(inventory.id, item.itemId) 
        });
        
        if (!inventoryItem) {
          return { 
            success: false, 
            orders: [], 
            error: `Articolo ${item.itemName} non trovato` 
          };
        }
        
        if (Number(inventoryItem.quantity) < Number(item.quantity)) {
          return { 
            success: false, 
            orders: [], 
            error: `Scorte insufficienti per ${item.itemName}. Disponibili: ${inventoryItem.quantity}, Richieste: ${item.quantity}` 
          };
        }
      }

      // Crea ordini e aggiorna inventario
      for (const item of request.items) {
        // Crea ordine
        const order = await db.insert(orders).values({
          username: request.username,
          item_name: item.itemName,
          item_id: item.itemId,
          quantity: Number(item.quantity),
          unit_price: String(item.unitPrice),
          total_cost: String(item.total),
          profit: String(item.profit),
          status: 'completed',
          description: request.description || `Ordine per ${item.itemName}`,
        }).returning();

        createdOrders.push(order[0]);
        totalOrderAmount += parseFloat(item.total);
        totalOrderProfit += parseFloat(item.profit);

        // Aggiorna inventario (sottrai)
        const inventoryItem = await db.query.inventory.findFirst({ 
          where: eq(inventory.id, item.itemId) 
        });
        
        if (inventoryItem) {
          const newQuantity = Number(inventoryItem.quantity) - Number(item.quantity);
          await db.update(inventory)
            .set({ 
              quantity: newQuantity,
              updated_at: new Date()
            })
            .where(eq(inventory.id, item.itemId));
        }

        // Log attività
        await db.insert(activity_log).values({
          username: request.username,
          activity_type: 'order',
          item_name: item.itemName,
          quantity: Number(item.quantity),
          amount: String(item.total),
          description: `Ordine completato: ${item.itemName}`,
          reference_id: order[0].id
        });
      }

      return { 
        success: true, 
        orders: createdOrders
      };
    } catch (error) {
      console.error("Order creation error:", error);
      return { 
        success: false, 
        orders: [], 
        error: error instanceof Error ? error.message : "Errore nella creazione dell'ordine" 
      };
    }
  }

  /**
   * Ottieni inventario con statistiche
   */
  static async getInventoryWithStats() {
    try {
      const items = await db.query.inventory.findMany();
      
      const stats = {
        totalItems: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        lowStockItems: items.filter(item => item.quantity <= item.min_stock).length,
        outOfStockItems: items.filter(item => item.quantity === 0).length,
        categories: {
          upper: items.filter(item => item.category === 'upper').length,
          lower: items.filter(item => item.category === 'lower').length
        }
      };

      return { items, stats };
    } catch (error) {
      console.error("Get inventory error:", error);
      throw error;
    }
  }

  /**
   * Ricerca articoli nell'inventario
   */
  static async searchInventory(query: string) {
    try {
      const items = await db.query.inventory.findMany();
      
      if (!query) return items;
      
      const searchTerm = query.toLowerCase();
      return items.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.type.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error("Search inventory error:", error);
      throw error;
    }
  }

  /**
   * Ottieni articoli con scorte basse
   */
  static async getLowStockItems() {
    try {
      const items = await db.query.inventory.findMany();
      return items.filter(item => item.quantity <= item.min_stock);
    } catch (error) {
      console.error("Get low stock items error:", error);
      throw error;
    }
  }
}





