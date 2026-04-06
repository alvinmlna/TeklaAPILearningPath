import React, { useState, useEffect, useCallback } from 'react'
import { readData, getSystemInfo, getSettings } from './lib/storage'
import Register from './screens/Register'
import Dashboard from './screens/Dashboard'
import Training from './screens/Training'
import Admin from './screens/Admin'
import Setup from './screens/Setup'

// Screens: 'loading' | 'setup' | 'register' | 'dashboard' | 'training' | 'admin'

export default function App() {
  const [screen, setScreen] = useState('loading')
  const [currentUser, setCurrentUser] = useState(null)
  const [data, setData] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [settings, setSettings] = useState(null)
  const [sysInfo, setSysInfo] = useState(null)

  const loadAndRoute = useCallback(async () => {
    try {
      const [appData, sysInfoResult, appSettings] = await Promise.all([readData(), getSystemInfo(), getSettings()])
      setData(appData)
      setSettings(appSettings)
      setSysInfo(sysInfoResult)

      const match = appData.users.find(
        (u) =>
          u.windowsAccount?.toLowerCase() === sysInfoResult.username?.toLowerCase() &&
          u.computerName?.toLowerCase() === sysInfoResult.hostname?.toLowerCase()
      )

      if (match) {
        setCurrentUser(match)
        setScreen('dashboard')
      } else {
        setScreen('register')
      }
    } catch (err) {
      console.error('Startup error:', err)
      setScreen('register')
    }
  }, [])

  useEffect(() => {
    loadAndRoute()
  }, [loadAndRoute])

  // Refresh data from disk and keep state in sync
  const refreshData = useCallback(async () => {
    const fresh = await readData()
    setData(fresh)
    // Keep currentUser in sync with any field updates
    if (currentUser) {
      const updated = fresh.users.find((u) => u.id === currentUser.id)
      if (updated) setCurrentUser(updated)
    }
    return fresh
  }, [currentUser])

  const handleRegistered = (user) => {
    setCurrentUser(user)
    setScreen('dashboard')
    refreshData()
  }

  const handleOpenTraining = (item) => {
    setSelectedItem(item)
    setScreen('training')
  }

  const handleOpenAdmin = () => {
    setScreen('admin')
  }

  const handleBackToDashboard = () => {
    setScreen('dashboard')
    setSelectedItem(null)
    refreshData()
  }

  // ─── Loading splash ───────────────────────────────────────────────────────
  if (screen === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-500 rounded-2xl flex items-center justify-center animate-pulse-slow">
            <span className="text-3xl">🎓</span>
          </div>
          <p className="text-indigo-600 font-semibold text-lg">Loading Training Tracker…</p>
        </div>
      </div>
    )
  }

  // ─── Setup (network path not configured) ─────────────────────────────────
  if (screen === 'setup') {
    return (
      <Setup
        currentDataPath={settings?.dataPath}
        onSkip={() => {
          const match = data?.users?.find(
            (u) =>
              u.windowsAccount?.toLowerCase() === sysInfo?.username?.toLowerCase() &&
              u.computerName?.toLowerCase() === sysInfo?.hostname?.toLowerCase()
          )
          if (match) { setCurrentUser(match); setScreen('dashboard') }
          else setScreen('register')
        }}
      />
    )
  }

  // ─── Registration ─────────────────────────────────────────────────────────
  if (screen === 'register') {
    return <Register onRegistered={handleRegistered} />
  }

  // ─── Dashboard ────────────────────────────────────────────────────────────
  if (screen === 'dashboard') {
    return (
      <Dashboard
        currentUser={currentUser}
        data={data}
        onOpenTraining={handleOpenTraining}
        onOpenAdmin={handleOpenAdmin}
        onRefresh={refreshData}
      />
    )
  }

  // ─── Training ─────────────────────────────────────────────────────────────
  if (screen === 'training') {
    return (
      <Training
        currentUser={currentUser}
        data={data}
        initialItem={selectedItem}
        onBack={handleBackToDashboard}
        onRefresh={refreshData}
      />
    )
  }

  // ─── Admin ────────────────────────────────────────────────────────────────
  if (screen === 'admin') {
    return (
      <Admin
        data={data}
        onBack={handleBackToDashboard}
        onRefresh={refreshData}
      />
    )
  }

  return null
}
