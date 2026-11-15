import { useTheme } from '../../theme/ThemeProvider';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getTask, updateTask } from '../../database/taskRepository';
import TaskForm from '../../components/TaskForm';
import { notify } from '../../utils/dialog';

export default function EditTask() {
  const {colors}=useTheme();
  const { id } = useLocalSearchParams();
  const [task, setTask] = useState(null);

  useEffect(() => {
    getTask(id)
      .then((t) => {
        if (!t || t.is_mine !== 1) { notify('Error', 'Only your own services can be edited'); router.back(); return; }
        setTask(t);
      })
      .catch((e) => notify('Error', String(e)));
  }, [id]);

  if (!task) return <Text style={{ padding: 20,color:colors.text }}>Loading service...</Text>;

  async function save(values) {
    await updateTask(id, values);
    notify('Saved', 'Service updated');
    router.back();
  }
  return <TaskForm title="Edit Service" submitLabel="Update service" initial={task} onSubmit={save} />;
}
