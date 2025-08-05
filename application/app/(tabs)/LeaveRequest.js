// app/LeaveRequest.js
import axios from 'axios';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// API base URL'sini burada tanımlayın
const API_BASE_URL = 'http://192.168.1.141:5050'; 

export default function LeaveRequestScreen() {
  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showLeaveTypeModal, setShowLeaveTypeModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [currentDateType, setCurrentDateType] = useState('start');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);

  const handleLeaveSubmit = async () => {
    if (!employeeId || !leaveType || (leaveType === 'Other' && !reason) || !startDate || !endDate) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }

    try {
      // Tarih formatını YYYY-MM-DD şekline çeviriyoruz
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];

      const response = await axios.post(`${API_BASE_URL}/api/leave/submit`, {
        personnel_per_id: parseInt(employeeId),
        request_start_date: formattedStartDate,
        request_end_date: formattedEndDate,
        request_type: leaveType,
        request_other: leaveType === 'Other' ? reason : null
      });

      Alert.alert('Success', 'Leave request submitted successfully!');
      
      // Formu temizle
      setEmployeeId('');
      setLeaveType('');
      setReason('');
      setStartDate(null);
      setEndDate(null);
      setShowReasonInput(false);
    } catch (error) {
      console.error('Error submitting leave request:', error);
      Alert.alert('Error', 'Failed to submit leave request. Please try again.');
    }
  };

  const leaveTypes = ['Annual', 'Sick', 'Maternity', 'Paternity', 'Other'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const years = Array.from({length: 10}, (_, i) => new Date().getFullYear() + i);
  const days = Array.from({length: 31}, (_, i) => i + 1);


  const handleLeaveTypeSelect = (type) => {
    setLeaveType(type);
    setShowReasonInput(type === 'Other');
    if (type !== 'Other') {
      setReason('');
    }
    setShowLeaveTypeModal(false);
  };

  const handleDateConfirm = () => {
    const selectedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);
    if (currentDateType === 'start') {
      setStartDate(selectedDate);
    } else {
      setEndDate(selectedDate);
    }
    setShowDateModal(false);
    setShowMonthPicker(false);
    setShowDayPicker(false);
    setShowYearPicker(false);
  };

  const formatDate = (date) => {
    return date ? date.toLocaleDateString() : '';
  };

  const openDatePicker = (dateType) => {
    setCurrentDateType(dateType);
    const dateToEdit = dateType === 'start' ? startDate : endDate;
    if (dateToEdit) {
      setSelectedDay(dateToEdit.getDate());
      setSelectedMonth(dateToEdit.getMonth() + 1);
      setSelectedYear(dateToEdit.getFullYear());
    }
    setShowDateModal(true);
  };

  const renderDatePickerModal = () => (
    <Modal
      visible={showDateModal}
      transparent={true}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, {height: 400}]}>
          <Text style={styles.modalTitle}>
            Select {currentDateType === 'start' ? 'Start' : 'End'} Date
          </Text>
          
          {/* Month Dropdown */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Month:</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => {
                setShowMonthPicker(!showMonthPicker);
                setShowDayPicker(false);
                setShowYearPicker(false);
              }}
            >
              <Text>{months[selectedMonth - 1]}</Text>
              <Ionicons 
                name={showMonthPicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#777" 
              />
            </TouchableOpacity>
            {showMonthPicker && (
            <View style={[styles.dropdownOptions, styles.monthDropdownOptions]}>
              <ScrollView>
                {months.map((month, index) => (
                  <TouchableOpacity
                    key={month}
                    style={[
                      styles.dropdownOption,
                      selectedMonth === index + 1 && styles.selectedOption
                    ]}
                    onPress={() => {
                      setSelectedMonth(index + 1);
                      setShowMonthPicker(false);
                    }}
                  >
                    <Text style={selectedMonth === index + 1 && {color: '#fff'}}>
                      {month}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          </View>

          {/* Day Dropdown */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Day:</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => {
                setShowDayPicker(!showDayPicker);
                setShowMonthPicker(false);
                setShowYearPicker(false);
              }}
            >
              <Text>{selectedDay}</Text>
              <Ionicons 
                name={showDayPicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#777" 
              />
            </TouchableOpacity>
            {showDayPicker && (
            <View style={[styles.dropdownOptions, styles.dayDropdownOptions]}>
              <ScrollView>
                {days.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dropdownOption,
                      selectedDay === day && styles.selectedOption
                    ]}
                    onPress={() => {
                      setSelectedDay(day);
                      setShowDayPicker(false);
                    }}
                  >
                    <Text style={selectedDay === day && {color: '#fff'}}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          </View>

          {/* Year Dropdown */}
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Year:</Text>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => {
                setShowYearPicker(!showYearPicker);
                setShowMonthPicker(false);
                setShowDayPicker(false);
              }}
            >
              <Text>{selectedYear}</Text>
              <Ionicons 
                name={showYearPicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#777" 
              />
            </TouchableOpacity>
            {showYearPicker && (
            <View style={[styles.dropdownOptions, styles.yearDropdownOptions]}>
              <ScrollView>
                {years.map((year) => (
                  <TouchableOpacity
                    key={year}
                    style={[
                      styles.dropdownOption,
                      selectedYear === year && styles.selectedOption
                    ]}
                    onPress={() => {
                      setSelectedYear(year);
                      setShowYearPicker(false);
                    }}
                  >
                    <Text style={selectedYear === year && {color: '#fff'}}>
                      {year}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
          </View>

          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: 'red'}]}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={{color: '#fff'}}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: '#135796'}]}
              onPress={handleDateConfirm}
            >
              <Text style={{color: '#fff'}}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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

      {showReasonInput && (
        <TextInput
          style={styles.input}
          placeholder="Please specify reason"
          placeholderTextColor="#777"
          value={reason}
          onChangeText={setReason}
        />
      )}

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
            <ScrollView>
              {leaveTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.modalOption}
                  onPress={() => handleLeaveTypeSelect(type)}
                >
                  <Text>{type}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowLeaveTypeModal(false)}
            >
              <Text style={{color: 'red'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {renderDatePickerModal()}

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
    paddingTop: 35,
    alignItems: 'center',
    backgroundColor: '#eef0f6ff',
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 18,
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
    width: '90%',
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
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
  },
  modalCancel: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownLabel: {
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#333',
  },
  dropdownButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  dropdownOptions: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f0f8ffff',
    zIndex: 1,
  },
  monthDropdownOptions: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 150,
  },
  dayDropdownOptions: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 150,
  },
  yearDropdownOptions: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 150,
  },
  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#135796',
  },
});