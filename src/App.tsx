import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/contexts/ThemeContext"
import AppLayout from "@/components/layout/AppLayout"
import Dashboard from "@/pages/Dashboard"
import AssetList from "@/pages/AssetList"
import AssetNew from "@/pages/AssetNew"
import AssetDetailPage from "@/pages/AssetDetailPage"
import AssetEdit from "@/pages/AssetEdit"
import Trash from "@/pages/Trash"
import Review from "@/pages/Review"
import AISettings from "@/pages/AISettings"
import DataBackup from "@/pages/DataBackup"
import AccountSettings from "@/pages/AccountSettings"
import ThemeSettings from "@/pages/ThemeSettings"

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<AssetList />} />
            <Route path="/assets/new" element={<AssetNew />} />
            <Route path="/assets/:id" element={<AssetDetailPage />} />
            <Route path="/assets/:id/edit" element={<AssetEdit />} />
            <Route path="/trash" element={<Trash />} />
            <Route path="/review" element={<Review />} />
            <Route path="/settings/account" element={<AccountSettings />} />
            <Route path="/settings/appearance" element={<ThemeSettings />} />
            <Route path="/settings/ai" element={<AISettings />} />
            <Route path="/settings/backup" element={<DataBackup />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  )
}
