"use client";
import * as Popover from '@radix-ui/react-popover';
import { useState } from 'react';
import { dateRangeFor, localDate, periodPresets, type DateRange, type PeriodPreset } from './model';

export function DesignIcon({ name }: { name: string }) {
  return <span className={`teacher-hours__icon teacher-hours__icon--${name}`} aria-hidden="true"><img src={`/teacher-hours/${name}.svg`} alt="" /></span>;
}
export function TeacherHoursPeriod({ preset, range, onChange }: { preset: PeriodPreset; range: DateRange; onChange: (preset: PeriodPreset, range: DateRange) => void }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => new Date(`${range.from}T12:00:00`));
  const [start, setStart] = useState<string | null>(null);
  const label = preset === 'custom' ? `${new Date(`${range.from}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(`${range.to}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : periodPresets.find(item => item.value === preset)?.label;
  const choose = (date: string) => {
    if (!start) { setStart(date); return; }
    onChange('custom', { from: date < start ? date : start, to: date < start ? start : date });
    setStart(null); setOpen(false);
  };
  const displayedRange = start ? { from: start, to: start } : range;
  return <Popover.Root open={open} onOpenChange={value => { setOpen(value); setStart(null); if (value) setMonth(new Date(`${range.from}T12:00:00`)); }}>
    <Popover.Trigger asChild><button type="button" className="teacher-hours__filter-button teacher-hours__period" aria-label={`Period: ${label}`}><DesignIcon name="calendar" /><span>{label}</span><DesignIcon name="down" /></button></Popover.Trigger>
    <Popover.Portal><Popover.Content className="teacher-hours__date-picker" align="start" sideOffset={4} collisionPadding={12} aria-label="Select date range">
      <div className="teacher-hours__presets">{periodPresets.map((item, index) => <button type="button" className={`${index === 4 ? 'after-divider ' : ''}${preset === item.value && !start ? 'is-selected' : ''}`} key={item.value} onClick={() => { onChange(item.value, dateRangeFor(item.value)); setOpen(false); }} aria-pressed={preset === item.value && !start}>{item.label}</button>)}</div>
      <div className="teacher-hours__calendars"><div className="teacher-hours__calendar-header"><button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><DesignIcon name="calendarPrevious" /></button>{[0, 1].map(offset => <strong key={offset}>{new Date(month.getFullYear(), month.getMonth() + offset, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>)}<button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><DesignIcon name="calendarNext" /></button></div>
        <div className="teacher-hours__calendar-grids">{[0, 1].map(offset => {
          const first = new Date(month.getFullYear(), month.getMonth() + offset, 1);
          const count = Math.ceil((first.getDay() + new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()) / 7) * 7;
          return <div key={offset} className="teacher-hours__calendar-grid"><div className="teacher-hours__weekdays">{['Su','Mo','Tu','We','Th','Fr','Sa'].map(day => <span key={day}>{day}</span>)}</div><div className="teacher-hours__days">{Array.from({ length: count }, (_, index) => {
            const date = new Date(first.getFullYear(), first.getMonth(), index - first.getDay() + 1), iso = localDate(date);
            const outside = date.getMonth() !== first.getMonth(), endpoint = iso === displayedRange.from || iso === displayedRange.to;
            const inside = iso >= displayedRange.from && iso <= displayedRange.to;
            return <button type="button" key={iso} disabled={outside} className={`${outside ? 'is-outside ' : ''}${inside ? 'is-in-range ' : ''}${endpoint ? 'is-endpoint' : ''}`} aria-label={date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} aria-pressed={inside} onClick={() => choose(iso)}>{date.getDate()}</button>;
          })}</div></div>;
        })}</div><span className="teacher-hours__sr-only" role="status">{start ? 'Select an end date.' : 'Select a start date, then an end date.'}</span>
      </div>
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
