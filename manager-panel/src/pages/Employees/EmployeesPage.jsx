import { useState, useEffect, useCallback } from 'react';
import { Search, Users, Phone, Mail, Building2, Calendar, Shield } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Administration', 'Development', 'Operations', 'Finance', 'Marketing', 'Sales', 'HR', 'Support'];

/* ── Skeletons ──────────────────────────────────────────── */
function RowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="skeleton w-9 h-9 rounded-xl shrink-0" />
          <div className="space-y-1.5">
            <div className="skeleton-text w-28" />
            <div className="skeleton-text w-36" />
          </div>
        </div>
      </td>
      {[80, 90, 80, 90, 70].map((w, i) => (
        <td key={i} className="px-4 py-4"><div className="skeleton-text" style={{ width: w }} /></td>
      ))}
    </tr>
  );
}

export default function EmployeesPage() {
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [department,  setDepartment]  = useState('');
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, limit: 20 });

  const fetchEmployees = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ page: pagination.page, limit: pagination.limit });
      if (search) params.set('search', search);
      if (department) params.set('department', department);
      const res = await api.get(`/employees?${params}`);
      setEmployees(res.data.data);
      setPagination((p) => ({ ...p, ...res.data.pagination }));
    } catch {
      setEmployees([]);
      if (!silent) toast.error('Failed to load employee records.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, department, pagination.page]);

  useEffect(() => {
    fetchEmployees();
    const interval = setInterval(() => {
      fetchEmployees(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchEmployees]);

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Team Directory</h1>
          <p className="page-subtitle">{pagination.total} employees total under your management</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 rounded-xl">
          <Users className="w-4 h-4 text-teal-400" />
          <span className="text-teal-400 text-xs font-semibold">{pagination.total} Members</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card-glass flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            className="input pl-9"
            placeholder="Search by name, email, code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select w-44"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper border-0 rounded-none">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Phone</th>
                <th>Joining Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? [1,2,3,4,5,6].map(i => <RowSkeleton key={i} />)
                : employees.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16">
                        <Users className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-2 opacity-40" />
                        <p className="text-[var(--text-secondary)] text-sm">No employees found</p>
                      </td>
                    </tr>
                  )
                  : employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {emp.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[var(--text-primary)] font-medium">{emp.name}</p>
                            <p className="text-[var(--text-secondary)] text-xs">{emp.employee_code} · {emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge-teal">{emp.department}</span></td>
                      <td className="text-[var(--text-primary)]">{emp.designation}</td>
                      <td className="text-[var(--text-secondary)] text-sm">{emp.phone}</td>
                      <td className="text-[var(--text-secondary)] text-sm">
                        {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-IN') : '–'}
                      </td>
                      <td>
                        <span className={emp.is_active ? 'badge-green' : 'badge-red'}>
                          {emp.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
