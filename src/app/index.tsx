import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { SyncProvider } from '@/components/providers/SyncProvider';
import { ThemeProviderContainer } from '@/components/providers/ThemeProviderContainer';
import { router } from '@/app/router';

const root = createRoot(document.getElementById('app')!);
root.render(<App />);

export function App() {
  return (
    <ThemeProviderContainer>
      <SyncProvider>
        <RouterProvider router={router} />
      </SyncProvider>
    </ThemeProviderContainer>
  );
}
