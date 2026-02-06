import { Layout } from './components/Layout/Layout';
import { Library } from './pages/Library';
import { Home } from './pages/Home';
import { Questions } from './pages/Questions';
import { Exam } from './pages/Exam';
import { Statistics } from './pages/Statistics';
import { HelpModal } from './components/ui/HelpModal';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { useFiles } from './hooks/useFiles';

function App() {
  const { stats } = useFiles();

  return (
    <>
      <Layout>
        {(activeTab) => {
          switch (activeTab) {
            case 'library':
              return <Library />;
            case 'questions':
              return <Questions />;
            case 'exam':
              return <Exam />;
            case 'stats':
              return <Statistics />;
            default:
              return <Home stats={stats} />;
          }
        }}
      </Layout>
      <HelpModal />
      <PWAUpdatePrompt />
    </>
  );
}

export default App;
