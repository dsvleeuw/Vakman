import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { DeliveryItem } from '../types';
import { formatDutchDate } from '../utils/quote';

/**
 * What Klusbaas does for the site of a customer.
 *
 * The same list appears in three places: in the offer (what the customer
 * buys), in his account (what is done) and in the overview of Klusbaas (his
 * to-do list). One list, three readers.
 */
export const DeliveryList: React.FC<{ items: DeliveryItem[]; deadline?: string }> = ({
  items,
  deadline,
}) => {
  if (items.length === 0) return null;
  const done = items.filter((item) => item.done).length;
  return (
    <div className="flex flex-col gap-2">
      <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm">
            {item.done ? (
              <CheckCircle2
                className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
            ) : (
              <Circle className="w-4 h-4 text-stone-300 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <span className={item.done ? 'text-stone-500' : 'text-stone-700'}>
              {item.label}
              {item.done && item.doneAt && (
                <span className="block text-xs text-stone-400">
                  Afgerond op {formatDutchDate(item.doneAt)}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="m-0 text-xs text-stone-500">
        {done} van {items.length} klaar
        {deadline ? ` · je site staat uiterlijk op ${formatDutchDate(deadline)} live` : ''}
      </p>
    </div>
  );
};
