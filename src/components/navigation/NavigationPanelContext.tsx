import React from 'react';

export type NavigationPanelController = {
  setTitle: (title: string) => void;
  setActions: (actions: React.ReactNode | null) => void;
  title: string;
  actions: React.ReactNode | null;
};

export const NavigationPanelContext = React.createContext<NavigationPanelController>({
  setTitle: () => {
    throw new Error(`No NavigationPanelContext has been provided`);
  },
  setActions: () => { },
  title: '',
  actions: null
});

export const NavigationPanelContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [title, setTitle] = React.useState('');
  const [actions, setActions] = React.useState<React.ReactNode | null>(null);

  return <NavigationPanelContext.Provider value={{ title, setTitle, actions, setActions }}>{children}</NavigationPanelContext.Provider>;
};

export const useNavigationPanel = () => React.useContext(NavigationPanelContext);
