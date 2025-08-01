// app/LeaveRequest.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LeaveRequestScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [currentDateType, setCurrentDateType] = useState('start'); // 'start' or 'end'
  const [tempDate, setTempDate] = useState({
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  const leaveTypes = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Unpaid'];

  const handleLeaveSubmit = () => {
    if (!employeeId || !leaveType || !reason || !startDate || !endDate) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    Alert.alert('Submitted', 'Leave request submitted successfully!');
  };

  const handleDateConfirm = () => {
    const selectedDate = new Date(tempDate.year, tempDate.month - 1, tempDate.day);
    if (currentDateType === 'start') {
      setStartDate(selectedDate);
    } else {
      setEndDate(selectedDate);
    }
    setShowDateModal(false);
  };

  const formatDate = (date) => {
    return date ? date.toLocaleDateString() : '';
  };

  const openDatePicker = (dateType) => {
    setCurrentDateType(dateType);
    const dateToEdit = dateType === 'start' ? startDate : endDate;
    if (dateToEdit) {
      setTempDate({
        day: dateToEdit.getDate(),
        month: dateToEdit.getMonth() + 1,
        year: dateToEdit.getFullYear()
      });
    } else {
      setTempDate({
        day: new Date().getDate(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
    }
    setShowDateModal(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance Control System</Text>

      <TextInput
        style={styles.input}
        placeholder="Employee ID"
        placeholderTextColor="#777"
        keyboardType="numeric"
        value={employeeId}
        onChangeText={setEmployeeId}
      />

      <TouchableOpacity 
        style={styles.leaveTypeContainer} 
        onPress={() => setShowLeaveTypeModal(true)}
      >
        <Text style={leaveType ? styles.inputText : styles.placeholderText}>
          {leaveType || 'Select Leave Type'}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#777" />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Reason"
        placeholderTextColor="#777"
        value={reason}
        onChangeText={setReason}
      />

      <View style={styles.dateRow}>
        <TouchableOpacity 
          style={styles.dateInputContainer} 
          onPress={() => openDatePicker('start')}
        >
          <Text style={startDate ? styles.inputText : styles.placeholderText}>
            {startDate ? formatDate(startDate) : 'Start Date'}
          </Text>
          <Ionicons name="calendar" size={20} color="#777" style={styles.dateIcon} />
        </TouchableOpacity>

        <Text style={styles.dateSeparator}>-</Text>

        <TouchableOpacity 
          style={styles.dateInputContainer} 
          onPress={() => openDatePicker('end')}
        >
          <Text style={endDate ? styles.inputText : styles.placeholderText}>
            {endDate ? formatDate(endDate) : 'End Date'}
          </Text>
          <Ionicons name="calendar" size={20} color="#777" style={styles.dateIcon} />
        </TouchableOpacity>
      </View>

      {/* Leave Type Modal */}
      <Modal
        visible={showLeaveTypeModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Leave Type</Text>
            {leaveTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.modalOption}
                onPress={() => {
                  setLeaveType(type);
                  setShowLeaveTypeModal(false);
                }}
              >
                <Text>{type}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowLeaveTypeModal(false)}
            >
              <Text style={{color: 'red'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDateModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Select {currentDateType === 'start' ? 'Start' : 'End'} Date
            </Text>
            <View style={styles.datePickerContainer}>
              <TextInput
                style={styles.dateInput}
                value={tempDate.day.toString()}
                onChangeText={(text) => setTempDate({...tempDate, day: parseInt(text) || 1})}
                keyboardType="numeric"
                placeholder="DD"
                placeholderTextColor="#777"
              />
              <Text style={styles.dateSeparator}>/</Text>
              <TextInput
                style={styles.dateInput}
                value={tempDate.month.toString()}
                onChangeText={(text) => setTempDate({...tempDate, month: parseInt(text) || 1})}
                keyboardType="numeric"
                placeholder="MM"
                placeholderTextColor="#777"
              />
              <Text style={styles.dateSeparator}>/</Text>
              <TextInput
                style={styles.dateInput}
                value={tempDate.year.toString()}
                onChangeText={(text) => setTempDate({...tempDate, year: parseInt(text) || new Date().getFullYear()})}
                keyboardType="numeric"
                placeholder="YYYY"
                placeholderTextColor="#777"
              />
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleDateConfirm}
            >
              <Text>OK</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={{color: 'red'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={styles.button} onPress={handleLeaveSubmit}>
        <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>

      <Text style={styles.project}>A Project Done in OSB Teknokent by:</Text>
      <Text style={styles.credits}>İpek Zorpineci - Ravad Nadam - Sude Terkan</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: '#eef0f6ff',
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#135796',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  inputText: {
    color: '#000',
  },
  placeholderText: {
    color: '#777',
  },
  leaveTypeContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    width: '100%',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  dateInputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateIcon: {
    marginLeft: 'auto',
  },
  dateSeparator: {
    marginHorizontal: 8,
    fontSize: 16,
    color: '#135796',
  },
  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    width: 60,
    padding: 8,
    textAlign: 'center',
    marginHorizontal: 5,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#135796',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    height: 60,
    marginTop: 20,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    alignSelf: 'center',
  },
  project: {
    position: 'absolute',
    bottom: 55,
    fontSize: 12,
    color: '#888',
  },
  credits: {
    position: 'absolute',
    bottom: 35,
    fontSize: 12,
    color: '#135796',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalButton: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 10,
  },
  modalCancel: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
});