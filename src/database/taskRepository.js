import { getSession, request, normalizeTask } from '../services/api';
import { validateService, toApiService } from '../utils/serviceDetails';
import { getDb } from './database';

export async function getTasks({ search = '', category = 'All', mine = false, favorites = false, listingType = 'All' } = {}) {
  if (getSession()) {
    const query = new URLSearchParams({ search, category });
    let tasks = (await request('/api/tasks?' + query)).map(normalizeTask);
    if (mine) tasks = tasks.filter(t => t.is_mine);
    if (favorites) tasks = [];
    if (listingType !== 'All') tasks = tasks.filter(t => t.listingType === listingType);
    return tasks;
  }
  const db = await getDb();
  const clauses = [], params = [];
  if (search.trim()) {
    const q = search.trim().replace(/[\\%_]/g, '\\$&');
    clauses.push("(title LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (category !== 'All') { clauses.push('category = ?'); params.push(category); }
  if (listingType !== 'All') { clauses.push('listingType = ?'); params.push(listingType); }
  if (mine) clauses.push('is_mine = 1');
  if (favorites) clauses.push('is_favorite = 1');
  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  return db.getAllAsync(`SELECT * FROM tasks ${where} ORDER BY id DESC`, params);
}
export async function getTask(id) {
  if (getSession()) return (await getTasks()).find(t => String(t.id) === String(id)) || null;
  return (await getDb()).getFirstAsync('SELECT * FROM tasks WHERE id = ?', [Number(id)]);
}
const serviceValues = t => [t.title,t.description,t.category,t.budget,t.student_name,t.listingType,t.priceUnit,t.availability,t.contactEmail,t.contactPhone];
export async function addTask(values) {
  const t = validateService(values);
  if (getSession()) return request('/api/tasks', { method: 'POST', body: JSON.stringify(toApiService(t)) });
  return (await getDb()).runAsync(`INSERT INTO tasks
    (title,description,category,budget,student_name,listingType,priceUnit,availability,contactEmail,contactPhone,is_mine)
    VALUES (?,?,?,?,?,?,?,?,?,?,1)`, serviceValues(t));
}
export async function updateTask(id, values) {
  const t = validateService(values);
  if (getSession()) return request('/api/tasks/' + id, { method: 'PUT', body: JSON.stringify(toApiService(t)) });
  return (await getDb()).runAsync(`UPDATE tasks SET title=?,description=?,category=?,budget=?,student_name=?,
    listingType=?,priceUnit=?,availability=?,contactEmail=?,contactPhone=? WHERE id=? AND is_mine=1`,
    [...serviceValues(t), Number(id)]);
}
export async function deleteTask(id) {
  if (getSession()) return request('/api/tasks/' + id, { method: 'DELETE' });
  return (await getDb()).runAsync('DELETE FROM tasks WHERE id=? AND is_mine=1', [Number(id)]);
}
export async function toggleFavorite(id, current) {
  return (await getDb()).runAsync('UPDATE tasks SET is_favorite=? WHERE id=?', [current ? 0 : 1, Number(id)]);
}
export async function changeStatus(id, status) {
  if (!['Available', 'Hired', 'In Progress', 'Completed'].includes(status)) throw new Error('Invalid status');
  if (getSession()) return request('/api/tasks/' + id, { method: 'PUT', body: JSON.stringify({ status }) });
  return (await getDb()).runAsync('UPDATE tasks SET status=? WHERE id=? AND is_mine=1', [status, Number(id)]);
}
