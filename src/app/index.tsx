// import { useEffect, useState } from "react";
// import { StyleSheet, Text, View } from "react-native";

// import {
//   addOrderItem,
//   createOrder,
//   deleteOrder,
//   getOrderById,
//   getOrderItems,
// } from "@/database/repositories/orderRepository";

// import {
//   getSetting,
//   setSetting,
// } from "@/database/repositories/settingsRepository";

// import {
//   createCustomer,
//   deleteCustomer,
// } from "@/database/repositories/customerRepository";

// export default function Index() {
//   const [status, setStatus] = useState("Running final database test...");

//   useEffect(() => {
//     async function runTest() {
//       let customerId: number | null = null;
//       let orderId: number | null = null;

//       try {
//         // -------------------------
//         // 1. CUSTOMER
//         // -------------------------

//         customerId = await createCustomer({
//           name: "Order Test Customer",
//           phone: "03001234567",
//         });

//         // -------------------------
//         // 2. SETTINGS
//         // -------------------------

//         await setSetting(
//           "test_business_name",
//           "The Stitch Center"
//         );

//         const setting = await getSetting(
//           "test_business_name"
//         );

//         if (setting !== "The Stitch Center") {
//           throw new Error("Settings test failed.");
//         }

//         // -------------------------
//         // 3. ORDER
//         // -------------------------

//         orderId = await createOrder({
//           receiptNumber: 999999,
//           customerId,
//           orderDate: "2026-09-11",
//           deliveryDate: "2026-09-20",
//           tailoringDetails: "Test tailoring details",
//           notes: "Test order",
//           total: 5000,
//           paid: 2000,
//           remaining: 3000,
//         });

//         const order = await getOrderById(orderId);

//         if (!order) {
//           throw new Error("Order creation/read test failed.");
//         }

//         if (order.receiptNumber !== 999999) {
//           throw new Error("Receipt number test failed.");
//         }

//         // -------------------------
//         // 4. ORDER ITEM
//         // -------------------------

//         await addOrderItem({
//           orderId,
//           name: "SUIT",
//           quantity: 5,
//           unitPrice: 1000,
//           notes: "Test item",
//         });

//         const items = await getOrderItems(orderId);

//         if (items.length !== 1) {
//           throw new Error("Order item test failed.");
//         }

//         if (items[0].quantity !== 5) {
//           throw new Error("Order item quantity test failed.");
//         }

//         if (items[0].unitPrice !== 1000) {
//           throw new Error("Order item price test failed.");
//         }

//         // -------------------------
//         // 5. CLEANUP
//         // -------------------------

//         await deleteOrder(orderId);
//         orderId = null;

//         await deleteCustomer(customerId);
//         customerId = null;

//         // -------------------------
//         // SUCCESS
//         // -------------------------

//         setStatus(
//           "All database tests passed successfully."
//         );
//       } catch (error) {
//         console.error("Database test failed:", error);

//         // Cleanup if something fails
//         try {
//           if (orderId !== null) {
//             await deleteOrder(orderId);
//           }

//           if (customerId !== null) {
//             await deleteCustomer(customerId);
//           }
//         } catch (cleanupError) {
//           console.error(
//             "Database cleanup failed:",
//             cleanupError
//           );
//         }

//         setStatus(
//           `Database test failed: ${error instanceof Error
//             ? error.message
//             : String(error)
//           }`
//         );
//       }
//     }

//     runTest();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>
//         The Stitch Center
//       </Text>

//       <Text style={styles.status}>
//         {status}
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 24,
//   },

//   title: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#17365D",
//     marginBottom: 16,
//   },

//   status: {
//     fontSize: 16,
//     textAlign: "center",
//     color: "#17202A",
//   },
// });

























// import { useEffect, useState } from "react";
// import { StyleSheet, Text, View } from "react-native";

// import {
//   getBusinessName,
//   getBusinessSubtitle,
//   getCurrency,
//   getNextReceiptNumber,
//   getReceiptWarning,
//   initializeDefaultSettings,
// } from "@/services/settingsService";

// import {
//   setSetting,
// } from "@/database/repositories/settingsRepository";

// import {
//   SETTING_KEYS,
// } from "@/constants/settings";

// export default function Index() {
//   const [status, setStatus] = useState(
//     "Testing settings..."
//   );

//   useEffect(() => {
//     async function runTest() {
//       try {
//         // Initialize defaults
//         await initializeDefaultSettings();

//         // Verify defaults
//         const businessName = await getBusinessName();
//         const subtitle = await getBusinessSubtitle();
//         const currency = await getCurrency();
//         const nextReceipt = await getNextReceiptNumber();
//         const warning = await getReceiptWarning();

//         if (businessName !== "The Stitch Center") {
//           throw new Error("Business name default failed.");
//         }

//         if (subtitle !== "Gents Specialist") {
//           throw new Error("Business subtitle default failed.");
//         }

//         if (currency !== "PKR") {
//           throw new Error("Currency default failed.");
//         }

//         if (nextReceipt !== 1) {
//           throw new Error("Receipt number default failed.");
//         }

//         if (!warning) {
//           throw new Error("Receipt warning default failed.");
//         }

//         // Test changing a setting
//         await setSetting(
//           SETTING_KEYS.businessName,
//           "Test Business"
//         );

//         const updatedName = await getBusinessName();

//         if (updatedName !== "Test Business") {
//           throw new Error("Settings update failed.");
//         }

//         // Restore the actual default
//         await setSetting(
//           SETTING_KEYS.businessName,
//           "The Stitch Center"
//         );

//         const restoredName = await getBusinessName();

//         if (restoredName !== "The Stitch Center") {
//           throw new Error("Settings restore failed.");
//         }

//         setStatus(
//           "Settings tests passed successfully."
//         );
//       } catch (error) {
//         console.error("Settings test failed:", error);

//         setStatus(
//           `Settings test failed: ${error instanceof Error
//             ? error.message
//             : String(error)
//           }`
//         );
//       }
//     }

//     runTest();
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>
//         The Stitch Center
//       </Text>

//       <Text style={styles.status}>
//         {status}
//       </Text>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 24,
//   },

//   title: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#17365D",
//     marginBottom: 16,
//   },

//   status: {
//     fontSize: 16,
//     textAlign: "center",
//     color: "#17202A",
//   },
// });
import CustomersScreen from "@/screens/CustomersScreen";

export default function Index() {
  return <CustomersScreen />;
}