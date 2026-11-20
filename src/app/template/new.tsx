import { Stack } from 'expo-router';

import { TemplateEditor } from '../../features/train/TemplateEditor';

export default function NewTemplate() {
  return (
    <>
      <Stack.Screen options={{ title: 'Nueva plantilla' }} />
      <TemplateEditor />
    </>
  );
}
