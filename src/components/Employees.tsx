'use client';
import { useState } from 'react';
import { useApp } from './AppContext';
import { Search, Filter, Plus, Download, Mail, Phone, MapPin, ChevronDown, Users, UserCheck, UserX, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const deptColors: Record<string, string> = {
  Sales: '#10B981', Housekeeping: '#F59E0B', Helper: '#06B6D4'
};
const avatarColors = ['#4F8EF7', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444'];

interface CardProps extends React.HTMLAttributes<HTMLDivElement> { children: React.ReactNode; style?: React.CSSProperties; }
const Card = ({ children, style = {}, ...rest }: CardProps) => (
  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', ...style }} {...rest}>{children}</div>
);

export default function Employees() {
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<string | null>(null);
  const { employees, openModal } = useApp();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase());
    const matchDept = dept === 'All' || e.dept === dept;
    return matchSearch && matchDept;
  });

  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'dept') {
      comparison = a.dept.localeCompare(b.dept);
    } else if (sortField === 'role') {
      comparison = a.role.localeCompare(b.role);
    } else if (sortField === 'salary') {
      const salA = parseInt(a.salary.replace(/[^0-9]/g, ''), 10) || 0;
      const salB = parseInt(b.salary.replace(/[^0-9]/g, ''), 10) || 0;
      comparison = salA - salB;
    } else if (sortField === 'joined') {
      const dateA = new Date(a.joined).getTime() || 0;
      const dateB = new Date(b.joined).getTime() || 0;
      comparison = dateA - dateB;
    } else if (sortField === 'id') {
      comparison = a.id.localeCompare(b.id);
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const tableHeaders = [
    { key: 'name', label: 'Employee' },
    { key: 'dept', label: 'Department' },
    { key: 'role', label: 'Role' },
    { key: 'location', label: 'Location' },
    { key: 'salary', label: 'Salary' },
    { key: 'joined', label: 'Joined' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>Employee Directory</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{employees.length} employees across {new Set(employees.map(e => e.dept)).size} departments</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => openModal('exportData')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 500, cursor: 'pointer', transition: 'var(--transition)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand)'; (e.currentTarget as HTMLElement).style.color = 'var(--brand)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          >
            <Download size={15} /> Export CSV
          </button>
          <button 
            onClick={() => openModal('addEmployee')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', background: 'var(--brand)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)', boxShadow: 'var(--shadow-brand)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--brand-dark)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--brand)'; }}
          >
            <Plus size={15} /> Add Employee
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
        {[
          { icon: Users,     label: 'Total',       value: employees.length.toString(), color: '#4F8EF7' },
          { icon: UserCheck, label: 'Active',       value: employees.filter(e => e.status === 'active').length.toString(), color: '#10B981' },
          { icon: UserX,     label: 'On Leave',     value: employees.filter(e => e.status === 'inactive').length.toString(),  color: '#F59E0B' },
          { icon: TrendingUp,label: 'New (30 days)',value: Math.max(1, employees.length - 7).toString(),  color: '#8B5CF6' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} style={{ padding: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', background: `${stat.color}18`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={stat.color} />
              </div>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>{stat.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{stat.label}</div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or role..."
            style={{ width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 12px 10px 36px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
            onFocus={e => { (e.target as HTMLElement).style.borderColor = 'var(--brand)'; }}
            onBlur={e => { (e.target as HTMLElement).style.borderColor = 'var(--border)'; }}
          />
        </div>

        {/* Department Filter */}
        <select
          value={dept}
          onChange={e => setDept(e.target.value)}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
        >
          {['All', 'Sales', 'Housekeeping', 'Helper'].map(d => (
            <option key={d} value={d} style={{ background: 'var(--bg-card)' }}>{d}</option>
          ))}
        </select>

        {/* Sort Options */}
        <select
          value={`${sortField}-${sortOrder}`}
          onChange={e => {
            const [field, order] = e.target.value.split('-');
            setSortField(field);
            setSortOrder(order as 'asc' | 'desc');
          }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 16px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
        >
          <option value="name-asc" style={{ background: 'var(--bg-card)' }}>Sort: Name (A-Z)</option>
          <option value="name-desc" style={{ background: 'var(--bg-card)' }}>Sort: Name (Z-A)</option>
          <option value="joined-desc" style={{ background: 'var(--bg-card)' }}>Sort: Joined (Newest)</option>
          <option value="joined-asc" style={{ background: 'var(--bg-card)' }}>Sort: Joined (Oldest)</option>
          <option value="salary-desc" style={{ background: 'var(--bg-card)' }}>Sort: Salary (High to Low)</option>
          <option value="salary-asc" style={{ background: 'var(--bg-card)' }}>Sort: Salary (Low to High)</option>
          <option value="dept-asc" style={{ background: 'var(--bg-card)' }}>Sort: Department (A-Z)</option>
          <option value="id-asc" style={{ background: 'var(--bg-card)' }}>Sort: Employee ID</option>
        </select>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '4px' }}>
          {(['table', 'grid'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', borderRadius: '6px', background: view === v ? 'var(--brand)' : 'transparent', color: view === v ? '#fff' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)', textTransform: 'capitalize' }}>{v}</button>
          ))}
        </div>
      </div>

      {/* Grid / Table */}
      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {sorted.map((emp, i) => (
            <Card key={emp.id} style={{ padding: '24px', cursor: 'pointer', transition: 'var(--transition)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = deptColors[emp.dept] || 'var(--brand)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              onClick={() => openModal('viewEmployee', emp)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ width: '48px', height: '48px', background: avatarColors[i % avatarColors.length], borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                  {emp.name.charAt(0)}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: emp.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: emp.status === 'active' ? '#10B981' : '#EF4444' }}>
                  {emp.status}
                </span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{emp.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{emp.role}</div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: `${deptColors[emp.dept]}20`, color: deptColors[emp.dept] }}>{emp.dept}</span>
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}><Mail size={12} />{emp.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}><MapPin size={12} />{emp.location}</div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {tableHeaders.map(col => {
                    const isSorted = sortField === col.key;
                    return (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        style={{
                          padding: '12px 20px',
                          textAlign: 'left',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isSorted ? 'var(--brand)' : 'var(--text-muted)',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid var(--border)',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'color 0.2s',
                        }}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <span>{col.label}</span>
                          {isSorted ? (
                            sortOrder === 'asc' ? <ArrowUp size={13} color="var(--brand)" /> : <ArrowDown size={13} color="var(--brand)" />
                          ) : (
                            <ArrowUpDown size={12} style={{ opacity: 0.3 }} />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {sorted.map((emp, i) => (
                  <tr key={emp.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    onClick={() => openModal('viewEmployee', emp)}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', background: avatarColors[i % avatarColors.length], borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: `${deptColors[emp.dept]}20`, color: deptColors[emp.dept] }}>{emp.dept}</span>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>{emp.role}</td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={12} />{emp.location}</td>
                    <td style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{emp.salary}</td>
                    <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>{emp.joined}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '100px', background: emp.status === 'active' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: emp.status === 'active' ? '#10B981' : '#EF4444' }}>
                        {emp.status}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Showing {sorted.length} of {employees.length} employees</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {Array.from({ length: Math.ceil(sorted.length / 10) || 1 }).map((_, idx) => (
                <button key={idx} style={{
                  width: '32px', height: '32px', borderRadius: '6px',
                  background: idx === 0 ? 'var(--brand)' : 'var(--bg-elevated)',
                  border: '1px solid', borderColor: idx === 0 ? 'var(--brand)' : 'var(--border)',
                  color: idx === 0 ? '#fff' : 'var(--text-secondary)',
                  fontSize: '12px', fontWeight: idx === 0 ? 700 : 400, cursor: 'pointer',
                }}>{idx + 1}</button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

