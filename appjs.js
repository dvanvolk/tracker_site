import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Scale, TrendingDown, Download, Calendar, Activity } from 'lucide-react';

function App() {
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
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [periodEndDate, setPeriodEndDate] = useState('');
  const [flowIntensity, setFlowIntensity] = useState('medium');
  const [symptoms, setSymptoms] = useState([]);

  const symptomOptions = ['Cramps', 'Bloating', 'Headache', 'Mood Changes', 'Fatigue', 'Back Pain', 'Breast Tenderness'];

  // ─── localStorage load on mount ───
  useEffect(() => {
    const storedUsers = localStorage.getItem('ht_users');
    const storedEntries = localStorage.getItem('ht_entries');
    const storedPeriods = localStorage.getItem('ht_periods');
    const lastUser = localStorage.getItem('ht_last_user');

    if (storedUsers) {
      const parsed = JSON.parse(storedUsers);
      setUsers(parsed);
      if (lastUser && parsed.find(u => u.id === lastUser)) {
        setCurrentUserId(lastUser);
      } else if (parsed.length > 0) {
        setCurrentUserId(parsed[0].id);
      }
    }
    if (storedEntries) setEntries(JSON.parse(storedEntries));
    if (storedPeriods) setPeriodEntries(JSON.parse(storedPeriods));
  }, []);

  // ─── localStorage save on change ───
  useEffect(() => { if (users.length > 0) localStorage.setItem('ht_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('ht_entries', JSON.stringify(entries)); }, [entries]);
  useEffect(() => { localStorage.setItem('ht_periods', JSON.stringify(periodEntries)); }, [periodEntries]);
  useEffect(() => { if (currentUserId) localStorage.setItem('ht_last_user', currentUserId); }, [currentUserId]);

  // ─── User Management ───
  const addUser = () => {
    if (!newUserName.trim() || users.length >= 2) return;
    const newUser = { id: 'user_' + Date.now(), name: newUserName.trim().substring(0, 50) };
    setUsers([...users, newUser]);
    setCurrentUserId(newUser.id);
    setNewUserName('');
    setShowAddUser(false);
  };

  // ─── Weight Entry ───
  const addWeightEntry = () => {
    const val = parseFloat(weight);
    if (!val || val <= 0 || val > 1000 || !currentUserId) {
      alert('Please enter a valid weight between 0 and 1000');
      return;
    }
    const timestamp = showBackdate && entryDate ? new Date(entryDate).getTime() : Date.now();
    const newEntry = {
      id: 'entry_' + timestamp + '_' + Math.random(),
      userId: currentUserId,
      weight: val,
      date: new Date(timestamp).toISOString(),
      timestamp
    };
    setEntries([...entries, newEntry].sort((a, b) => a.timestamp - b.timestamp));
    setWeight('');
    setEntryDate('');
    setShowBackdate(false);
  };

  // ─── Period Entry ───
  const addPeriodEntry = () => {
    if (!periodStartDate || !currentUserId) {
      alert('Please enter a start date');
      return;
    }
    const startTs = new Date(periodStartDate).getTime();
    const endTs = periodEndDate ? new Date(periodEndDate).getTime() : null;
    if (endTs && endTs < startTs) {
      alert('End date must be after start date');
      return;
    }

    const newPeriod = {
      id: 'period_' + Date.now() + '_' + Math.random(),
      userId: currentUserId,
      startDate: new Date(startTs).toISOString(),
      endDate: endTs ? new Date(endTs).toISOString() : null,
      startTimestamp: startTs,
      endTimestamp: endTs,
      flowIntensity,
      symptoms,
      cycleLength: null
    };

    const updated = [...periodEntries, newPeriod].sort((a, b) => a.startTimestamp - b.startTimestamp);

    // Recalculate cycle lengths for current user
    const userPeriods = updated.filter(e => e.userId === currentUserId);
    for (let i = 1; i < userPeriods.length; i++) {
      userPeriods[i].cycleLength = Math.round((userPeriods[i].startTimestamp - userPeriods[i - 1].startTimestamp) / 86400000);
    }

    setPeriodEntries(updated);
    setPeriodStartDate('');
    setPeriodEndDate('');
    setFlowIntensity('medium');
    setSymptoms([]);
  };

  const toggleSymptom = (s) => setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  // ─── Derived Data ───
  const userEntries = entries.filter(e => e.userId === currentUserId).sort((a, b) => a.timestamp - b.timestamp);
  const userPeriods = periodEntries.filter(e => e.userId === currentUserId).sort((a, b) => a.startTimestamp - b.startTimestamp);

  const filteredEntries = (() => {
    if (timeframe === 'all') return userEntries;
    const cutoff = Date.now() - parseInt(timeframe) * 86400000;
    return userEntries.filter(e => e.timestamp >= cutoff);
  })();

  const chartData = filteredEntries.map(e => ({
    date: new Date(e.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: e.weight
  }));

  const stats = (() => {
    if (userEntries.length === 0) return { current: 0, highest: 0, lost: 0 };
    const current = userEntries[userEntries.length - 1].weight;
    const highest = Math.max(...userEntries.map(e => e.weight));
    return { current, highest, lost: highest - current };
  })();

  const periodStats = (() => {
    if (userPeriods.length === 0) return { avgCycle: 0, lastPeriod: null, nextPredicted: null };
    const cycles = userPeriods.filter(p => p.cycleLength).map(p => p.cycleLength);
    const avgCycle = cycles.length > 0 ? Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length) : 28;
    const lastPeriod = userPeriods[userPeriods.length - 1];
    const nextPredicted = new Date(lastPeriod.startTimestamp + avgCycle * 86400000);
    return { avgCycle, lastPeriod, nextPredicted };
  })();

  // ─── CSV Export ───
  const exportToCSV = () => {
    const headers = ['Type', 'User', 'Date', 'Value', 'Details', 'Timestamp'];
    const wRows = entries.map(e => {
      const u = users.find(x => x.id === e.userId);
      return ['Weight', u ? u.name : 'Unknown', new Date(e.timestamp).toLocaleString(), e.weight + ' lbs', '', e.timestamp];
    });
    const pRows = periodEntries.map(e => {
      const u = users.find(x => x.id === e.userId);
      const end = e.endDate ? new Date(e.endTimestamp).toLocaleDateString() : 'Ongoing';
      return [
        'Period', u ? u.name : 'Unknown',
        new Date(e.startTimestamp).toLocaleDateString(),
        'Start: ' + new Date(e.startTimestamp).toLocaleDateString() + ' End: ' + end,
        'Flow: ' + e.flowIntensity + ' Symptoms: ' + (e.symptoms.join('; ') || 'None') + ' Cycle: ' + (e.cycleLength || 'N/A') + ' days',
        e.startTimestamp
      ];
    });
    const csv = [headers, ...wRows, ...pRows].map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'health_tracker_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentUser = users.find(u => u.id === currentUserId);

  // ─── RENDER ───
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">

        {/* ── Header ── */}
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
              disabled={entries.length === 0 && periodEntries.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>

          {/* User dropdown */}
          <div className="flex flex-col sm:flex-row gap-3">
            {users.length > 0 && (
              <select
                value={currentUserId || ''}
                onChange={(e) => setCurrentUserId(e.target.value)}
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              >
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
            {users.length < 2 && !showAddUser && (
              <button onClick={() => setShowAddUser(true)} className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                {users.length === 0 ? 'Add First User' : 'Add Second User'}
              </button>
            )}
          </div>

          {/* Add user form */}
          {showAddUser && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addUser()}
                placeholder="Enter user name"
                maxLength={50}
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button onClick={addUser} className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Add</button>
              <button onClick={() => { setShowAddUser(false); setNewUserName(''); }} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">Cancel</button>
            </div>
          )}
        </div>

        {/* ── Welcome screen if no user ── */}
        {!currentUser && users.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Activity size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">Welcome! Add your first user to start tracking.</p>
          </div>
        )}

        {/* ── Tabs ── */}
        {currentUser && (
          <div className="bg-white rounded-2xl shadow-lg p-2 mb-6 flex gap-2">
            <button
              onClick={() => setActiveTab('weight')}
              className={`flex-1 px-6 py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2 ${activeTab === 'weight' ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Scale size={20} /> Weight Tracking
            </button>
            <button
              onClick={() => setActiveTab('period')}
              className={`flex-1 px-6 py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2 ${activeTab === 'period' ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Calendar size={20} /> Period Tracking
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* ── WEIGHT TAB ── */}
        {/* ══════════════════════════════════════ */}
        {currentUser && activeTab === 'weight' && (
          <>
            {/* Stats */}
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
                  <TrendingDown size={16} /> Pounds Lost
                </div>
                <div className="text-3xl font-bold text-green-600">{stats.lost.toFixed(1)} lbs</div>
              </div>
            </div>

            {/* Log Weight Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Log Weight</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addWeightEntry()}
                  placeholder="Enter weight (lbs)"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                />
                <button
                  onClick={() => setShowBackdate(!showBackdate)}
                  className={`px-4 py-3 rounded-lg transition-colors flex items-center gap-2 ${showBackdate ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <Calendar size={18} />
                  <span className="hidden sm:inline">Backdate</span>
                </button>
                <button onClick={addWeightEntry} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all font-medium">
                  Log Weight
                </button>
              </div>
              {showBackdate && (
                <input
                  type="datetime-local"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="mt-3 w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              )}
            </div>

            {/* Chart */}
            {chartData.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                  <h2 className="text-xl font-bold text-gray-800">Progress Chart</h2>
                  <div className="flex gap-2">
                    {['7', '30', '90', 'all'].map(tf => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-4 py-2 rounded-lg transition-colors font-medium ${timeframe === tf ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {tf === 'all' ? 'All' : tf + 'd'}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '2px solid #e5e7eb', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Scale size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 text-lg">No weight entries yet. Start tracking to see your progress!</p>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════ */}
        {/* ── PERIOD TAB ── */}
        {/* ══════════════════════════════════════ */}
        {currentUser && activeTab === 'period' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-pink-500">
                <div className="text-gray-600 text-sm font-medium mb-1">Average Cycle</div>
                <div className="text-3xl font-bold text-gray-800">{periodStats.avgCycle} days</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-rose-500">
                <div className="text-gray-600 text-sm font-medium mb-1">Last Period</div>
                <div className="text-xl font-bold text-gray-800">
                  {periodStats.lastPeriod ? new Date(periodStats.lastPeriod.startTimestamp).toLocaleDateString() : 'No data'}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="text-gray-600 text-sm font-medium mb-1">Next Predicted</div>
                <div className="text-xl font-bold text-gray-800">
                  {periodStats.nextPredicted ? periodStats.nextPredicted.toLocaleDateString() : 'No data'}
                </div>
              </div>
            </div>

            {/* Log Period Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Log Period</h2>
              <div className="space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input type="date" value={periodStartDate} onChange={(e) => setPeriodStartDate(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date (Optional)</label>
                    <input type="date" value={periodEndDate} onChange={(e) => setPeriodEndDate(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none" />
                  </div>
                </div>

                {/* Flow */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Flow Intensity</label>
                  <div className="flex gap-2">
                    {['light', 'medium', 'heavy'].map(i => (
                      <button key={i} onClick={() => setFlowIntensity(i)} className={`flex-1 px-4 py-2 rounded-lg transition-colors capitalize ${flowIntensity === i ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {i}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Symptoms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Symptoms (Optional)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {symptomOptions.map(s => (
                      <button key={s} onClick={() => toggleSymptom(s)} className={`px-3 py-2 rounded-lg transition-colors text-sm ${symptoms.includes(s) ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={addPeriodEntry} className="w-full px-8 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg hover:from-pink-600 hover:to-rose-700 transition-all font-medium">
                  Log Period
                </button>
              </div>
            </div>

            {/* Period History */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Period History</h2>
              {userPeriods.length > 0 ? (
                <div className="space-y-3">
                  {[...userPeriods].reverse().map(p => (
                    <div key={p.id} className="border-l-4 border-pink-500 bg-pink-50 p-4 rounded-lg">
                      <div className="font-semibold text-gray-800">
                        {new Date(p.startTimestamp).toLocaleDateString()} – {p.endDate ? new Date(p.endTimestamp).toLocaleDateString() : 'Ongoing'}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Flow: <span className="capitalize">{p.flowIntensity}</span>
                        {p.cycleLength && ' • Cycle: ' + p.cycleLength + ' days'}
                      </div>
                      {p.symptoms.length > 0 && (
                        <div className="text-sm text-gray-600 mt-1">Symptoms: {p.symptoms.join(', ')}</div>
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
      </div>
    </div>
  );
}

export default App;