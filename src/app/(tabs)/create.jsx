import { useLocalProfile } from '../../context/LocalProfileProvider';
import { useSession } from '../../services/useSession';
import { getSession } from '../../services/api';
import { useState } from 'react';
import { router } from 'expo-router';
import { addTask } from '../../database/taskRepository';
import TaskForm from '../../components/TaskForm';
import { notify } from '../../utils/dialog';

export default function Create() {
  const {profile}=useLocalProfile(),session=useSession();
  const [formKey, setFormKey] = useState(0); // changing the key clears the form
  async function save(values) {
    await addTask(values);
    setFormKey((k) => k + 1);
    notify('Saved', getSession()?'Service published to UniTask':'Service saved on this device');
    router.navigate('/(tabs)/my-tasks');
  }
  return <TaskForm key={profile.id+(session?.user?._id || '')+formKey} title="Offer a Service" submitLabel={getSession()?'Publish service':'Save service on this device'} onSubmit={save} />;
}

