export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-extrabold text-slate-900">Admin Console</h1>
        <p className="text-slate-500 mt-1">Manage users, courses, and system settings.</p>
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Users', value: '1,280', icon: '👥', color: 'bg-indigo-500' },
          { label: 'Active Courses', value: '42', icon: '📚', color: 'bg-emerald-500' },
          { label: 'Total Revenue', value: '$12.4k', icon: '💰', color: 'bg-amber-500' },
          { label: 'Support Tickets', value: '8', icon: '🎫', color: 'bg-rose-500' }
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-slate-100 mb-4`}>
              {stat.icon}
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">Recent Enrolments</h2>
            <button className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-all">Export CVS</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { user: 'Sarah Connor', course: 'React Mastery', date: '2 Mins ago', status: 'Success' },
                { user: 'James Smith', course: 'UI Design 101', date: '1 Hour ago', status: 'Success' },
                { user: 'Elena Rodriguez', course: 'Next.js Advanced', date: '5 Hours ago', status: 'Pending' }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{row.user}</td>
                  <td className="px-6 py-4 text-slate-600">{row.course}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{row.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      row.status === 'Success' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
