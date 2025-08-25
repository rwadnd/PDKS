import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RemoteWork = () => {
  const [requests, setRequests] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPersonnel, setSelectedPersonnel] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [workMode, setWorkMode] = useState('Remote');
  const [requestReason, setRequestReason] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, personnelRes] = await Promise.all([
        axios.get('/api/remote-work/requests'),
        axios.get('/api/personnel')
      ]);
      
      setRequests(requestsRes.data);
      setPersonnel(personnelRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/remote-work/requests', {
        personnelId: selectedPersonnel,
        requestDate,
        workMode,
        requestReason
      });
      
      // Reset form
      setSelectedPersonnel('');
      setRequestDate('');
      setWorkMode('Remote');
      setRequestReason('');
      setShowForm(false);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Error creating request: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await axios.put(`/api/remote-work/requests/${requestId}/status`, {
        status,
        approvedBy: 1 // TODO: Get current user ID
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status: ' + (error.response?.data?.error || error.message));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getWorkModeColor = (mode) => {
    switch (mode) {
      case 'Remote': return 'text-blue-600 bg-blue-100';
      case 'Hybrid': return 'text-purple-600 bg-purple-100';
      case 'Office': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Uzaktan Çalışma Yönetimi</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'İptal' : 'Yeni Talep'}
        </button>
      </div>

      {/* New Request Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Yeni Uzaktan Çalışma Talebi</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personel
                </label>
                <select
                  value={selectedPersonnel}
                  onChange={(e) => setSelectedPersonnel(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Personel Seçin</option>
                  {personnel.map((p) => (
                    <option key={p.per_id} value={p.per_id}>
                      {p.per_name} {p.per_lname} - {p.per_department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Çalışma Modu
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Remote">Uzaktan</option>
                  <option value="Hybrid">Hibrit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sebep
                </label>
                <input
                  type="text"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Uzaktan çalışma sebebi..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Talep Oluştur
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Uzaktan Çalışma Talepleri</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mod
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sebep
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Onaylayan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => (
                <tr key={request.request_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {request.per_name} {request.per_lname}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.per_department} - {request.per_role}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(request.request_date).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getWorkModeColor(request.work_mode)}`}>
                      {request.work_mode === 'Remote' ? 'Uzaktan' : 'Hibrit'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {request.request_reason || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status === 'Pending' ? 'Beklemede' : 
                       request.status === 'Approved' ? 'Onaylandı' : 'Reddedildi'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.approved_by_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === 'Pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleStatusUpdate(request.request_id, 'Approved')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Onayla
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(request.request_id, 'Rejected')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Reddet
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {requests.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Henüz uzaktan çalışma talebi bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoteWork;
