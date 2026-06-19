import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PatientList } from '@/pages/PatientList';
import { AssessmentDetail } from '@/pages/AssessmentDetail';
import { ReportPreview } from '@/pages/ReportPreview';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/patients" replace />} />
          <Route path="/patients" element={<PatientList />} />
          <Route
            path="/patients/:id/assessment"
            element={<AssessmentDetail />}
          />
          <Route path="/patients/:id/report" element={<ReportPreview />} />
          <Route path="*" element={<Navigate to="/patients" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
