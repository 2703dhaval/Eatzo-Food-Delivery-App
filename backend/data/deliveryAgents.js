// Mock delivery agents
const deliveryAgents = [
  { id: 'D001', name: 'Arjun Kumar', phone: '9876543210', vehicle: 'Bike', vehicleNo: 'DL 01 AB 1234', avatar: '🏍️', rating: 4.8, totalDeliveries: 342, isOnline: true, currentOrderId: null },
  { id: 'D002', name: 'Priya Sharma', phone: '9812345678', vehicle: 'Bike', vehicleNo: 'MH 02 CD 5678', avatar: '🛵', rating: 4.6, totalDeliveries: 189, isOnline: true, currentOrderId: null },
  { id: 'D003', name: 'Rahul Singh', phone: '9898989898', vehicle: 'Bicycle', vehicleNo: 'CYCLE-001', avatar: '🚴', rating: 4.9, totalDeliveries: 521, isOnline: false, currentOrderId: null },
  { id: 'D004', name: 'Sneha Patel', phone: '9955667788', vehicle: 'Scooter', vehicleNo: 'GJ 05 EF 9012', avatar: '🛵', rating: 4.7, totalDeliveries: 267, isOnline: true, currentOrderId: null },
  { id: 'D005', name: 'Karan Mehta', phone: '9966778899', vehicle: 'Bike', vehicleNo: 'KA 08 GH 3456', avatar: '🏍️', rating: 4.5, totalDeliveries: 156, isOnline: true, currentOrderId: null },
];

// Delivery credentials (agentId → password)
const deliveryCredentials = {
  'D001': 'delivery123',
  'D002': 'delivery123',
  'D003': 'delivery123',
  'D004': 'delivery123',
  'D005': 'delivery123',
};

module.exports = { deliveryAgents, deliveryCredentials };
