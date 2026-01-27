import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, TrendingDown, Download, Calendar, Activity } from 'lucide-react';

const WeightTracker = () => {
  const [users, setUsers] = useState([]);
  const [entries, setEntries] = useState([]);
  const [periodEntries, setPeriodEntries] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [weight, setWeight] = useState('');
  const [entryDate, setEntryDate] = useState('');
  const [showBackdate, setShowBackdate] = useState(false);
  const [timeframe, setTimeframe] = useState('30');
  const [newUserName, setNewUserName] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [activeTab, setActiveTab] = useState('weight');
  
  // Period tracking states
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [periodEndDate, setPeriodEndDate] = useState('');
  const [flowIntensity, setFlowIntensity] = useState('medium');
  const [symptoms, setSymptoms] = useState([]);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedUsers = localStorage.getItem('weight_tracker_users');
    const storedEntries = localStorage.getItem('weight_tracker_entries');
    const storedPeriodEntries = localStorage.getItem('weight_tracker_period_entries');
    const lastUser = localStorage.getItem('weight_tracker_last_user');

    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      setUsers(parsedUsers);
      if (lastUser && parsedUsers.find(u => u.id === lastUser)) {
        setCurrentUserId(lastUser);
      } else if (parsedUsers.length > 0) {
        setCurrentUserId(parsedUsers[0].id);
      }
    }

    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    }

    if (storedPeriodEntries) {
      setPeriodEntries(JSON.parse(storedPeriodEntries));
    }
  }, []);

  // Save users to localStorage
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('weight_tracker_users', JSON.stringify(users));
    }
  }, [users]);

  // Save entries to localStorage
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('weight_tracker_entries', JSON.stringify(entries));
    }
  }, [entries]);

  // Save period entries to localStorage
  useEffect(() => {
    if (periodEntries.length > 0) {
      localStorage.setItem('weight_tracker_period_entries', JSON.stringify(periodEntries));
    }
  }, [periodEntries]);

  // Save last user to localStorage
  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('weight_tracker_last_user', currentUserId);
    }
  }, [currentUserId]);

  const addUser = () => {
    if (!newUserName.trim()) return;
    if (users.length >= 2) {
      alert('Maximum 2 users allowed');
      return;
    }

    const sanitizedName = newUserName.trim().substring(0, 50);
    const newUser = {
      id: `user_${Date.now()}`,
      name: sanitizedName
    };

    setUsers([...users, newUser]);
    setCurrentUserId(newUser.id);
    setNewUserName('');
    setShowAddUser(false);
  };

  const addWeightEntry = () => {
    const weightValue = parseFloat(weight);
    if (!weightValue || weightValue <= 0 || weightValue > 1000) {
      alert('Please enter a valid weight between 0 and 1000');
      return;
    }

    if (!currentUserId) {
      alert('Please select a user first');
      return;
    }

    const timestamp = showBackdate && entryDate 
      ? new Date(entryDate).getTime() 
      : Date.now();

    const newEntry = {
      id: `entry_${timestamp}_${Math.random()}`,
      userId: currentUserId,
      weight: weightValue,
      date: new Date(timestamp).toISOString(),
      timestamp: timestamp
    };

    setEntries([...entries, newEntry].sort((a, b) => a.timestamp - b.timestamp));
    setWeight('');
    setEntryDate('');
    setShowBackdate(false);
  };

  const addPeriodEntry = () => {
    if (!periodStartDate) {
      alert('Please enter a start date');
      return;
    }

    if (!currentUserId) {
      alert('Please select a user first');
      return;
    }

    const startTimestamp = new Date(periodStartDate).getTime();
    const endTimestamp = periodEndDate ? new Date(periodEndDate).getTime() : null;

    if (endTimestamp && endTimestamp < startTimestamp) {
      alert('End date must be after start date');
      return;
    }

    const newPeriodEntry = {
      id: `period_${Date.now()}_${Math.random()}`,
      userId: currentUserId,
      startDate: new Date(startTimestamp).toISOString(),
      endDate: endTimestamp ? new Date(endTimestamp).toISOString() : null,
      startTimestamp: startTimestamp,
      endTimestamp: endTimestamp,
      flowIntensity: flowIntensity,
      symptoms: symptoms,
      cycleLength: null
    };

    const updatedEntries = [...periodEntries, newPeriodEntry].sort((a, b) => a.startTimestamp - b.startTimestamp);
    
    // Calculate cycle lengths
    const userPeriods = updatedEntries.filter(e => e.userId === currentUserId);
    for (let i = 1; i < userPeriods.length; i++) {
      const daysBetween = Math.round((userPeriods[i].startTimestamp - userPeriods[i-1].startTimestamp) / (1000 * 60 * 60 * 24));
      userPeriods[i].cycleLength = daysBetween;
    }

    setPeriodEntries(updatedEntries);
    setPeriodStartDate('');
    setPeriodEndDate('');
    setFlowIntensity('medium');
    setSymptoms([]);
  };

  const toggleSymptom = (symptom) => {
    setSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const getCurrentUserEntries = () => {
    return entries
      .filter(e => e.userId === currentUserId)
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const getCurrentUserPeriods = () => {
    return periodEntries
      .filter(e => e.userId === currentUserId)
      .sort((a, b) => a.startTimestamp - b.startTimestamp);
  };

  const getFilteredEntries = () => {
    const userEntries = getCurrentUserEntries();
    if (timeframe === 'all') return userEntries;

    const days = parseInt(timeframe);
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    return userEntries.filter(e => e.timestamp >= cutoff);
  };

  const getStats = () => {
    const userEntries = getCurrentUserEntries();
    if (userEntries.length === 0) {
      return { current: 0, highest: 0, lost: 0 };
    }

    const current = userEntries[userEntries.length - 1].weight;
    const highest = Math.max(...userEntries.map(e => e.weight));
    const lost = highest - current;

    return { current, highest, lost };
  };

  const getPeriodStats = () => {
    const userPeriods = getCurrentUserPeriods();
    if (userPeriods.length === 0) {
      return { avgCycle: 0, lastPeriod: null, nextPredicted: null };
    }

    const cycleLengths = userPeriods
      .filter(p => p.cycleLength)
      .map(p => p.cycleLength);
    
    const avgCycle = cycleLengths.length > 0 
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : 28;

    const lastPeriod = userPeriods[userPeriods.length - 1];
    const nextPredicted = lastPeriod 
      ? new Date(lastPeriod.startTimestamp + (avgCycle * 24 * 60 * 60 * 1000))
      : null;

    return { avgCycle, lastPeriod, nextPredicted };
  };

  const exportToCSV = () => {
    const headers = ['Type', 'User', 'Date', 'Value', 'Details', 'Timestamp'];
    const weightRows = entries.map(entry => {
      const user = users.find(u => u.id === entry.userId);
      return [
        'Weight',
        user ? user.name : 'Unknown',
        new Date(entry.timestamp).toLocaleString(),
        `${entry.weight} lbs`,
        '',
        entry.timestamp
      ];
    });

    const periodRows = periodEntries.map(entry => {
      const user = users.find(u => u.id === entry.userId);
      const endDate = entry.endDate ? new Date(entry.endTimestamp).toLocaleDateString() : 'Ongoing';
      const details = `Flow: ${entry.flowIntensity}, Symptoms: ${entry.symptoms.join(', ') || 'None'}, Cycle: ${entry.cycleLength || 'N/A'} days`;
      return [
        'Period',
        user ? user.name : 'Unknown',
        new Date(entry.startTimestamp).toLocaleDateString(),
        `Start: ${new Date(entry.startTimestamp).toLocaleDateString()}, End: ${endDate}`,
        details,
        entry.startTimestamp
      ];
    });

    const csvContent = [
      headers.join(','),
      ...weightRows.map(row => row.join(','))
      ,...periodRows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health_tracker_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = getStats();
  const periodStats = getPeriodStats();
  const chartData = getFilteredEntries().map(e => ({
    date: new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: e.weight
  }));

  const currentUser = users.find(u => u.id === currentUserId);

  const symptomOptions = ['Cramps', 'Bloating', 'Headache', 'Mood Changes', 'Fatigue', 'Back Pain', 'Breast Tenderness'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
                <Activity className="text-white" size={28} />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Health Tracker
              </h1>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              disabled={entries.length === 0 && periodEntries.length === 0}
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export Data</span>
            </button>
          </div>

          {/* User Selection */}
          <div className="flex flex-col sm:flex-row gap-3">
            {users.length > 0 ? (
              <select
                value={currentUserId || ''}
                onChange={(e) => setCurrentUserId(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            ) : null}
            
            {users.length < 2 && !showAddUser && (
              <button
                onClick={() => setShowAddUser(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                {users.length === 0 ? 'Add First User' : 'Add Second User'}
              </button>
            )}
          </div>

          {showAddUser && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter user name"
                maxLength={50}
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && addUser()}
              />
              <button
                onClick={addUser}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddUser(false);
                  setNewUserName('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {currentUser && (
          <>
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl shadow-lg p-2 mb-6 flex gap-2">
              <button
                onClick={() => setActiveTab('weight')}
                className={`flex-1 px-6 py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2 ${
                  activeTab === 'weight'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Scale size={20} />
                Weight Tracking
              </button>
              <button
                onClick={() => setActiveTab('period')}
                className={`flex-1 px-6 py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2 ${
                  activeTab === 'period'
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Calendar size={20} />
                Period Tracking
              </button>
            </div>

            {/* Weight Tracking Tab */}
            {activeTab === 'weight' && (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                    <div className="text-gray-600 text-sm font-medium mb-1">Current Weight</div>
                    <div className="text-3xl font-bold text-gray-800">{stats.current.toFixed(1)} lbs</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                    <div className="text-gray-600 text-sm font-medium mb-1">Highest Weight</div>
                    <div className="text-3xl font-bold text-gray-800">{stats.highest.toFixed(1)} lbs</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                    <div className="text-gray-600 text-sm font-medium mb-1 flex items-center gap-2">
                      <TrendingDown size={16} />
                      Pounds Lost
                    </div>
                    <div className="text-3xl font-bold text-green-600">{stats.lost.toFixed(1)} lbs</div>
                  </div>
                </div>

                {/* Weight Entry Form */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Log Weight</h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <input
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="Enter weight (lbs)"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                        onKeyPress={(e) => e.key === 'Enter' && addWeightEntry()}
                      />
                    </div>
                    <button
                      onClick={() => setShowBackdate(!showBackdate)}
                      className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                        showBackdate ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      <Calendar size={18} />
                      <span className="hidden sm:inline">Backdate</span>
                    </button>
                    <button
                      onClick={addWeightEntry}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium"
                    >
                      Log Weight
                    </button>
                  </div>
                  {showBackdate && (
                    <div className="mt-3">
                      <input
                        type="datetime-local"
                        value={entryDate}
                        onChange={(e) => setEntryDate(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Chart */}
                {chartData.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                      <h2 className="text-xl font-bold text-gray-800">Progress Chart</h2>
                      <div className="flex gap-2">
                        {['7', '30', '90', 'all'].map(tf => (
                          <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                              timeframe === tf
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {tf === 'all' ? 'All' : `${tf}d`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="date" 
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                          domain={['dataMin - 5', 'dataMax + 5']}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '2px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#8b5cf6" 
                          strokeWidth={3}
                          dot={{ fill: '#8b5cf6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {chartData.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                    <div className="text-gray-400 mb-2">
                      <Scale size={48} className="mx-auto mb-4" />
                    </div>
                    <p className="text-gray-600 text-lg">No weight entries yet. Start tracking to see your progress!</p>
                  </div>
                )}
              </>
            )}

            {/* Period Tracking Tab */}
            {activeTab === 'period' && (
              <>
                {/* Period Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-pink-500">
                    <div className="text-gray-600 text-sm font-medium mb-1">Average Cycle</div>
                    <div className="text-3xl font-bold text-gray-800">{periodStats.avgCycle} days</div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-rose-500">
                    <div className="text-gray-600 text-sm font-medium mb-1">Last Period</div>
                    <div className="text-xl font-bold text-gray-800">
                      {periodStats.lastPeriod 
                        ? new Date(periodStats.lastPeriod.startTimestamp).toLocaleDateString()
                        : 'No data'}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                    <div className="text-gray-600 text-sm font-medium mb-1">Next Predicted</div>
                    <div className="text-xl font-bold text-gray-800">
                      {periodStats.nextPredicted 
                        ? periodStats.nextPredicted.toLocaleDateString()
                        : 'No data'}
                    </div>
                  </div>
                </div>

                {/* Period Entry Form */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Log Period</h2>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                        <input
                          type="date"
                          value={periodStartDate}
                          onChange={(e) => setPeriodStartDate(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                        <input
                          type="date"
                          value={periodEndDate}
                          onChange={(e) => setPeriodEndDate(e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Flow Intensity</label>
                      <div className="flex gap-2">
                        {['light', 'medium', 'heavy'].map(intensity => (
                          <button
                            key={intensity}
                            onClick={() => setFlowIntensity(intensity)}
                            className={`flex-1 px-4 py-2 rounded-lg transition-colors capitalize ${
                              flowIntensity === intensity
                                ? 'bg-pink-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {intensity}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms (Optional)</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {symptomOptions.map(symptom => (
                          <button
                            key={symptom}
                            onClick={() => toggleSymptom(symptom)}
                            className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                              symptoms.includes(symptom)
                                ? 'bg-pink-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {symptom}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={addPeriodEntry}
                      className="w-full px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all font-medium"
                    >
                      Log Period
                    </button>
                  </div>
                </div>

                {/* Period History */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Period History</h2>
                  {getCurrentUserPeriods().length > 0 ? (
                    <div className="space-y-3">
                      {getCurrentUserPeriods().reverse().map(period => (
                        <div key={period.id} className="border-l-4 border-pink-500 bg-pink-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-gray-800">
                                {new Date(period.startTimestamp).toLocaleDateString()} - {' '}
                                {period.endDate 
                                  ? new Date(period.endTimestamp).toLocaleDateString()
                                  : 'Ongoing'}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Flow: <span className="capitalize">{period.flowIntensity}</span>
                                {period.cycleLength && ` • Cycle: ${period.cycleLength} days`}
                              </div>
                            </div>
                          </div>
                          {period.symptoms.length > 0 && (
                            <div className="text-sm text-gray-600 mt-2">
                              Symptoms: {period.symptoms.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 text-lg">No period entries yet. Start tracking your cycle!</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {!currentUser && users.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Activity size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg mb-4">Welcome! Add your first user to start tracking health data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightTracker;