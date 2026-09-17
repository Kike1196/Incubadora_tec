import { createContext, useContext, useState } from 'react';
import { initialData } from './data';

const Context = createContext(null);
// Intentionally memory-only: reference data never becomes real account or payment data.
export function PortalProvider({ children }) {
  const [data, setData] = useState(initialData);
  const [notice, setNotice] = useState('');
  const update = (collection, item) => setData(previous => ({ ...previous, [collection]: previous[collection].some(row => row.id === item.id) ? previous[collection].map(row => row.id === item.id ? { ...row, ...item } : row) : [...previous[collection], item] }));
  const remove = (collection, id) => setData(previous => ({ ...previous, [collection]: previous[collection].filter(row => row.id !== id) }));
  return <Context.Provider value={{ data, setData, update, remove, notice, notify: setNotice }}>{children}</Context.Provider>;
}
export const usePortal = () => useContext(Context);
