import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getTask, updateTask } from '../../database/taskRepository';
import TaskForm from '../../components/TaskForm';
import { notify } from '../../utils/dialog';

export default function EditTask() {
  const { id } = useLocalSearchParams();
  const [task, setTask] = useState(null);

  useEffect(() => {
    getTask(id)
      .then((t) => {
        if (!t || t.is_mine !== 1) { notify('Error', 'Only your own tasks can be edited'); router.back(); return; }
        setTask(t);
      })
      .catch((e) => notify('Error', String(e)));
  }, [id]);

  if (!task) return <Text style={{ padding: 20 }}>Loading task...</Text>;

  async function save(values) {
    await updateTask(id, values);
    notify('Saved', 'Task updated');
    router.back();
  }
  return <TaskForm title="Edit Task" submitLabel="Update Task" initial={task} onSubmit={save} />;
}
