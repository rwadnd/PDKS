// app/LeaveRequest.js
import axios from "axios";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const API_BASE_URL = "http://192.168.1.141:5050";

export default function MyRequests() {
  const [employeeId, setEmployeeId] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null); // NEW: track row being deleted

  const fetchLeaves = async () => {
    const idNum = parseInt(employeeId, 10);
    if (!idNum || idNum <= 0) {
      Alert.alert("Hata", "Lütfen geçerli bir Personel ID giriniz.");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/leave/${idNum}`);
      setLeaves(res.data || []);
      if (!res.data || res.data.length === 0) {
        Alert.alert("Bilgi", "Bu ID için izin kaydı bulunamadı.");
      }
    } catch (err) {
      console.error("Failed to retrieve leave requests:", err?.response?.data || err.message);
      Alert.alert("Hata", "İzin kayıtları alınamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // NEW: delete handler with confirm + optimistic UI update
  const handleDelete = (leaveId) => {
    Alert.alert(
      "Silinsin mi?",
      "Bu izin kaydını kalıcı olarak silmek istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingId(leaveId);
              await axios.delete(`${API_BASE_URL}/api/leave/${leaveId}`);
              setLeaves((prev) => prev.filter((l) => l.request_id !== leaveId));
              Alert.alert("Başarılı", "İzin kaydı silindi.");
            } catch (err) {
              console.error("Delete failed:", err?.response?.data || err.message);
              Alert.alert("Hata", "Kayıt silinemedi. Lütfen tekrar deneyin.");
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
            {/* NOTE: if your column is request_status, prefer item.request_status */}
            <Text style={styles.line}>Status: {item.status ?? item.request_status ?? "—"}</Text>

            <View style={styles.footerRow}>
              <Text style={styles.lineMuted}>Personnel ID: {item.personnel_per_id}</Text>

              {/* NEW: Delete button */}
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
