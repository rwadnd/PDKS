// app/LeaveRequest.js
import axios from "axios";
import { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const API_BASE_URL = "http://192.168.1.142:5050";

export default function MyRequests() {
  const [employeeId, setEmployeeId] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // track row being deleted

  const fetchLeaves = async () => {
    const idNum = parseInt(employeeId, 10);
    if (!idNum || idNum <= 0) {
      Alert.alert("Error", "Please enter a valid Personnel ID.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/leave/${idNum}`);
      setLeaves(res.data || []);
      if (!res.data || res.data.length === 0) {
        Alert.alert("Information", "No leave record found for this ID.");
      }
    } catch (err) {
      console.error("Failed to retrieve leave requests:", err?.response?.data || err.message);
      Alert.alert("Error", "Failed to retrieve leave requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // delete handler with confirm + optimistic UI update
  const handleDelete = (leaveId) => {
    Alert.alert(
      "Delete it?",
      "Are you sure you want to permanently delete this leave record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(leaveId);
              await axios.delete(`${API_BASE_URL}/api/leave/${leaveId}`);
              setLeaves((prev) => prev.filter((l) => l.request_id !== leaveId));
              Alert.alert("Success", "Leave record deleted.");
            } catch (err) {
              console.error("Delete failed:", err?.response?.data || err.message);
              Alert.alert("Error", "Record could not be deleted. Please try again.");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leave Requests</Text>

      <View style={styles.row}>
        <Ionicons name="person-circle-outline" size={22} />
        <TextInput
          style={styles.input}
          placeholder="Enter Personnel ID"
          keyboardType="number-pad"
          value={employeeId}
          onChangeText={setEmployeeId}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={fetchLeaves} disabled={loading}>
        {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Fetch Requests</Text>}
      </TouchableOpacity>

      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 24 }}>
        {leaves.map((item) => (
          <View key={item.id || `${item.personnel_per_id}-${item.request_start_date}-${item.request_end_date}`} style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.per_name} {item.per_lname} • {item.per_department}
            </Text>

            <Text style={styles.line}>
              Type: {item.request_type}
              {item.request_other ? ` (${item.request_other})` : ""}
            </Text>
            <Text style={styles.line}>
              From: {item.request_start_date}  To: {item.request_end_date}
            </Text>
            <Text style={styles.line}>Status: {item.status ?? item.request_status ?? "—"}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.lineMuted}>Personnel ID: {item.personnel_per_id}</Text>

              {item.request_id ? (
                <TouchableOpacity
                  style={[styles.delBtn, deletingId === item.request_id && { opacity: 0.6 }]}
                  onPress={() => handleDelete(item.request_id)}
                  disabled={deletingId === item.request_id}
                >
                  {deletingId === item.id ? (
                    <ActivityIndicator />
                  ) : (
                    <Text style={styles.delBtnText}>Delete</Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  input: { flex: 1, marginLeft: 8, fontSize: 16, paddingVertical: 6 },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  list: { marginTop: 4 },
  card: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  line: { fontSize: 14, marginBottom: 2 },
  lineMuted: { fontSize: 12, color: "#6b7280" },
  footerRow: { marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  delBtn: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  delBtnText: { color: "#fff", fontWeight: "700" },
});