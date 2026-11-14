import { useState } from 'react';
import { router } from 'expo-router';
import { addTask } from '../../database/taskRepository';
import TaskForm from '../../components/TaskForm';
import { notify } from '../../utils/dialog';

export default function Create() {
  const [formKey, setFormKey] = useState(0); // changing the key clears the form
  async function save(values) {
    await addTask(values);
    setFormKey((k) => k + 1);
    notify('Saved', 'Task stored offline');
    router.navigate('/(tabs)/my-tasks');
  }
  return <TaskForm key={formKey} title="Create New Task" submitLabel="Save Task Offline" onSubmit={save} />;
}
