import { AttendanceRecord, LeaveApplication, Incentive, Commission, AdvancePayment, PublicHoliday, Employee } from '@/components/AppContext';

export interface SalaryBreakdown {
  employeeId: string;
  employeeName: string;
  monthlySalary: number;
  year: number;
  month: number;
  monthCode: string;
  calendarDays: number;
  thursdaysCount: number;
  holidaysCount: number;
  payableWorkingDays: number;
  dailyRate: number;
  paidFullDays: number;
  approvedPaidLeaveDays: number;
  paidHalfDays: number;
  absentDays: number;
  thursdaysOff: number;
  holidaysOff: number;
  earnedBasic: number;
  basic: number; // monthly basic salary reference
  gross: number; // basic + incentives + overtimeAmount
  incentives: number;
  overtimeHours: number;
  overtimeAmount: number;
  overtimeRemarks: string;
  lopDeduction: number;
  advanceDeduction: number;
  totalDeductions: number; // lopDeduction + advanceDeduction
  netPay: number; // gross - totalDeductions
}

export function parseSalary(salStr: any): number {
  if (!salStr || (typeof salStr !== 'string' && typeof salStr !== 'number')) return 25000;
  if (typeof salStr === 'number') return salStr;
  const clean = salStr.replace(/[^\d]/g, '');
  const val = parseInt(clean, 10);
  return isNaN(val) ? 25000 : val;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate(); // month is 1-12
}

export function getThursdaysInMonth(year: number, month: number): number {
  const daysInMonth = getDaysInMonth(year, month);
  let thursdays = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    if (d.getDay() === 4) { // 4 is Thursday
      thursdays++;
    }
  }
  return thursdays;
}

export function getHolidaysInMonth(year: number, month: number, holidays: PublicHoliday[]): PublicHoliday[] {
  const monthStr = `${year}-${String(month).padStart(2, '0')}`;
  return (holidays || []).filter(h => h.date.startsWith(monthStr));
}

export function getNonThursdayHolidaysInMonth(year: number, month: number, holidays: PublicHoliday[]): PublicHoliday[] {
  const monthHolidays = getHolidaysInMonth(year, month, holidays);
  return monthHolidays.filter(h => {
    const [y, m, d] = h.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.getDay() !== 4; // Not Thursday
  });
}

export function getPayableWorkingDays(year: number, month: number, holidays: PublicHoliday[]): number {
  const totalDays = getDaysInMonth(year, month);
  const thursdays = getThursdaysInMonth(year, month);
  const nonThuHolidays = getNonThursdayHolidaysInMonth(year, month, holidays).length;
  const payable = totalDays - thursdays - nonThuHolidays;
  return Math.max(1, payable); // ensure no division by zero
}

export function calculateMonthlySalaryBreakdown(
  emp: Employee,
  monthCode: string, // YYYY-MM e.g. "2026-03"
  attendanceRecords: AttendanceRecord[],
  leaves: LeaveApplication[],
  incentives: Incentive[],
  commissions: Commission[],
  advancePayments: AdvancePayment[],
  overtimeRate: number = 150,
  holidays: PublicHoliday[] = []
): SalaryBreakdown {
  const [yearStr, monthStr] = monthCode.split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthStr, 10) || 3;

  const calendarDays = getDaysInMonth(year, month);
  const thursdaysCount = getThursdaysInMonth(year, month);
  const nonThuHolidays = getNonThursdayHolidaysInMonth(year, month, holidays);
  const holidaysCount = nonThuHolidays.length;

  const payableWorkingDays = getPayableWorkingDays(year, month, holidays);
  const monthlySalary = parseSalary(emp.salary);
  const dailyRate = monthlySalary / payableWorkingDays;

  // Filter attendance records for this employee & month
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const empRecords = attendanceRecords.filter(
    r => r.employeeId === emp.id && r.date.startsWith(monthPrefix)
  );

  let paidFullDays = 0;
  let paidHalfDays = 0;
  let approvedPaidLeaveDays = 0;
  let explicitAbsentDays = 0;
  let overtimeHours = 0;
  const overtimeRemarkParts: string[] = [];

  // Group by date
  const recordMap = new Map<string, AttendanceRecord>();
  empRecords.forEach(r => recordMap.set(r.date, r));

  const extraDayHourlyRate = dailyRate / 8;
  let overtimeAmount = 0;

  for (let day = 1; day <= calendarDays; day++) {
    const dayStr = `${monthPrefix}-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, day);
    const isThursday = dateObj.getDay() === 4;
    const isHoliday = nonThuHolidays.some(h => h.date === dayStr);

    const rec = recordMap.get(dayStr);

    if (rec) {
      if (rec.status === 'present' || rec.status === 'late' || rec.status === 'wfh') {
        if (isThursday || isHoliday) {
          const hrs = rec.overtimeHours || 8;
          overtimeHours += hrs;
          const dayOTPay = Math.round(hrs * extraDayHourlyRate);
          overtimeAmount += dayOTPay;
          const reasonStr = isThursday ? 'Thursday Weekly Off' : 'National Holiday';
          overtimeRemarkParts.push(`${hrs}h Extra Day OT on ${dayStr} (${reasonStr}) [+₹${dayOTPay.toLocaleString('en-IN')}]`);
        } else {
          paidFullDays++;
        }
      } else if (rec.status === 'half_day') {
        if (isThursday || isHoliday) {
          const hrs = rec.overtimeHours || 4;
          overtimeHours += hrs;
          const dayOTPay = Math.round(hrs * extraDayHourlyRate);
          overtimeAmount += dayOTPay;
          overtimeRemarkParts.push(`${hrs}h Half Day OT on ${dayStr} [+₹${dayOTPay.toLocaleString('en-IN')}]`);
        } else {
          paidHalfDays++;
        }
      } else if (rec.status === 'overtime') {
        const hrs = rec.overtimeHours || 8;
        overtimeHours += hrs;
        const dayOTPay = Math.round(hrs * extraDayHourlyRate);
        overtimeAmount += dayOTPay;
        const reason = rec.overtimeReason || (isThursday ? 'Thursday OT' : 'Holiday OT');
        overtimeRemarkParts.push(`${hrs}h OT on ${dayStr} (${reason}) [+₹${dayOTPay.toLocaleString('en-IN')}]`);
      } else if (rec.status === 'absent') {
        if (!isThursday && !isHoliday) {
          // Check if there is an approved paid leave request for this date
          const hasApprovedPaidLeave = leaves.some(l => 
            l.employeeId === emp.id &&
            l.status === 'approved' &&
            dayStr >= l.from && dayStr <= l.to &&
            l.type !== 'unpaid' && l.type !== 'LOP' && !l.reason?.toLowerCase().includes('unpaid') && !l.reason?.toLowerCase().includes('lop')
          );

          if (hasApprovedPaidLeave) {
            approvedPaidLeaveDays++;
          } else {
            explicitAbsentDays++;
          }
        }
      }
    } else {
      // Unrecorded day — check for approved leave
      if (!isThursday && !isHoliday) {
        const approvedLeave = leaves.find(l => 
          l.employeeId === emp.id &&
          l.status === 'approved' &&
          dayStr >= l.from && dayStr <= l.to
        );

        if (approvedLeave) {
          const isUnpaid = approvedLeave.type === 'unpaid' || approvedLeave.type === 'LOP' || approvedLeave.reason?.toLowerCase().includes('unpaid') || approvedLeave.reason?.toLowerCase().includes('lop');
          if (isUnpaid) {
            explicitAbsentDays++;
          } else {
            approvedPaidLeaveDays++;
          }
        } else {
          // If no record exists, default to full day present for unrecorded working days
          paidFullDays++;
        }
      }
    }
  }

  // Calculate actual total paid days (Present days + Approved Paid Leaves + 0.5 * Half Days)
  const earnedBasic = Math.round((paidFullDays + approvedPaidLeaveDays + 0.5 * paidHalfDays) * dailyRate);
  
  // Calculate LOP Deduction: (Absent Days + 0.5 * Half Days) * dailyRate
  const lopDeduction = Math.round((explicitAbsentDays + 0.5 * paidHalfDays) * dailyRate);

  const overtimeRemarks = overtimeRemarkParts.length > 0
    ? `Overtime worked: ${overtimeRemarkParts.join('; ')}`
    : '';

  // Incentives & Commissions
  const empIncentives = incentives.filter(
    inc => inc.employeeId === emp.id && 
           (inc.status === 'approved' || inc.status === 'paid') && 
           (inc.month.startsWith(monthPrefix) || inc.month.includes(monthStr))
  );
  
  const empCommissions = commissions.filter(
    com => (com.leadName.toLowerCase() === emp.name.toLowerCase() || com.leadId === emp.id || com.leadId.replace('LEAD', 'EMP') === emp.id) && 
           (com.status === 'approved' || com.status === 'paid') && 
           (com.month.startsWith(monthPrefix) || com.month.includes(monthStr))
  );

  const totalIncentives = empIncentives.reduce((sum, inc) => sum + inc.amount, 0) + empCommissions.reduce((sum, com) => sum + com.amount, 0);

  // Gross Earnings = Basic Salary Earned + Incentives + Overtime Payment
  const gross = earnedBasic + totalIncentives + overtimeAmount;

  // Advance Deductions: Supports multi-month installment recovery (e.g. ₹1,000/month for a ₹5,000 advance)
  let advanceDeduction = 0;
  const empAdvances = advancePayments.filter(
    adv => adv.employeeId === emp.id && adv.status !== 'deducted'
  );

  for (const adv of empAdvances) {
    if (adv.customSchedule && typeof adv.customSchedule === 'object' && adv.customSchedule[monthCode] !== undefined) {
      advanceDeduction += Number(adv.customSchedule[monthCode]) || 0;
    } else {
      const instAmt = adv.monthlyDeduction && adv.monthlyDeduction > 0 ? adv.monthlyDeduction : adv.amount;
      const startYear = parseInt(adv.deductMonth.split('-')[0], 10);
      const startMonth = parseInt(adv.deductMonth.split('-')[1], 10);
      const curYear = parseInt(monthCode.split('-')[0], 10);
      const curMonth = parseInt(monthCode.split('-')[1], 10);

      const monthsElapsed = (curYear - startYear) * 12 + (curMonth - startMonth);

      if (monthsElapsed >= 0) {
        const priorDeductions = Math.min(adv.amount, monthsElapsed * instAmt);
        const remainingBalance = adv.amount - priorDeductions;
        if (remainingBalance > 0) {
          const monthDeduct = Math.min(remainingBalance, instAmt);
          advanceDeduction += monthDeduct;
        }
      }
    }
  }

  // Total Deductions = Loss of Pay (LOP) + Salary Advance
  const totalDeductions = lopDeduction + advanceDeduction;

  // Net Pay = Gross Earnings - Total Deductions
  const netPay = gross - totalDeductions;

  return {
    employeeId: emp.id,
    employeeName: emp.name,
    monthlySalary,
    year,
    month,
    monthCode,
    calendarDays,
    thursdaysCount,
    holidaysCount,
    payableWorkingDays,
    dailyRate,
    paidFullDays,
    approvedPaidLeaveDays,
    paidHalfDays,
    absentDays: explicitAbsentDays,
    thursdaysOff: thursdaysCount,
    holidaysOff: holidaysCount,
    earnedBasic,
    basic: earnedBasic,
    gross,
    incentives: totalIncentives,
    overtimeHours,
    overtimeAmount,
    overtimeRemarks,
    lopDeduction,
    advanceDeduction,
    totalDeductions,
    netPay
  };
}

export function calculateMonthlySalaryProgress(
  emp: Employee,
  currentDate: Date = new Date(),
  attendanceRecords: AttendanceRecord[] = [],
  holidays: PublicHoliday[] = [],
  overtimeRate: number = 150
) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const dayOfMonth = currentDate.getDate();
  const monthCode = `${year}-${String(month).padStart(2, '0')}`;

  const payableWorkingDays = getPayableWorkingDays(year, month, holidays);
  const monthlySalary = parseSalary(emp.salary);
  const dailyRate = monthlySalary / payableWorkingDays;

  const nonThuHolidays = getNonThursdayHolidaysInMonth(year, month, holidays);

  // Count elapsed working days up to today
  let elapsedWorkingDays = 0;
  for (let d = 1; d <= dayOfMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const dayStr = `${monthCode}-${String(d).padStart(2, '0')}`;
    const isThursday = dateObj.getDay() === 4;
    const isHoliday = nonThuHolidays.some(h => h.date === dayStr);
    if (!isThursday && !isHoliday) {
      elapsedWorkingDays++;
    }
  }

  // Calculate actual attendance status up to today
  const empRecords = attendanceRecords.filter(
    r => r.employeeId === emp.id && r.date.startsWith(monthCode)
  );

  const recordMap = new Map<string, AttendanceRecord>();
  empRecords.forEach(r => recordMap.set(r.date, r));

  let workedFullDays = 0;
  let workedHalfDays = 0;
  let absentDays = 0;
  let overtimeHours = 0;

  for (let d = 1; d <= dayOfMonth; d++) {
    const dayStr = `${monthCode}-${String(d).padStart(2, '0')}`;
    const dateObj = new Date(year, month - 1, d);
    const isThursday = dateObj.getDay() === 4;
    const isHoliday = nonThuHolidays.some(h => h.date === dayStr);

    const rec = recordMap.get(dayStr);
    if (rec) {
      if (rec.status === 'present' || rec.status === 'late' || rec.status === 'wfh') {
        if (isThursday || isHoliday) {
          overtimeHours += (rec.overtimeHours || 8);
        } else {
          workedFullDays++;
        }
      } else if (rec.status === 'half_day') {
        if (isThursday || isHoliday) {
          overtimeHours += (rec.overtimeHours || 4);
        } else {
          workedHalfDays++;
        }
      } else if (rec.status === 'overtime') {
        overtimeHours += (rec.overtimeHours || 8);
      } else if (rec.status === 'absent') {
        if (!isThursday && !isHoliday) {
          absentDays++;
        }
      }
    } else {
      if (!isThursday && !isHoliday) {
        workedFullDays++;
      }
    }
  }

  const extraDayHourlyRate = dailyRate / 8;
  const overtimePay = Math.round(overtimeHours * extraDayHourlyRate);
  const earnedSalarySoFar = Math.round((workedFullDays + 0.5 * workedHalfDays) * dailyRate + overtimePay);
  const progressPercent = Math.min(100, Math.max(0, Math.round((earnedSalarySoFar / monthlySalary) * 100)));

  return {
    monthCode,
    dayOfMonth,
    elapsedWorkingDays,
    payableWorkingDays,
    dailyRate: Math.round(dailyRate),
    earnedSalarySoFar,
    monthlySalary,
    progressPercent,
    workedFullDays,
    workedHalfDays,
    absentDays,
    overtimeHours,
    overtimePay
  };
}
