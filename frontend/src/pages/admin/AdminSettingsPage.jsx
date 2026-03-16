import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiSave } from 'react-icons/fi'
import { fetchSettings, updateSettings } from '../../api/auth'

export function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({ display_name: '', username: '', email: '' })
  const [displayName, setDisplayName] = useState('')
  const [nameStatus, setNameStatus] = useState(null)
  const [nameSaving, setNameSaving] = useState(false)
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' })
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        setSettings(s)
        setDisplayName(s.display_name || '')
      })
      .catch(() => setNameStatus('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSaveDisplayName(e) {
    e.preventDefault()
    setNameStatus(null)
    setNameSaving(true)
    try {
      await updateSettings({ display_name: displayName })
      setSettings((prev) => ({ ...prev, display_name: displayName }))
      setNameStatus('Display name updated.')
    } catch (err) {
      setNameStatus(err.message)
    } finally {
      setNameSaving(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setPasswordStatus(null)
    if (password.new !== password.confirm) {
      setPasswordStatus('New passwords do not match.')
      return
    }
    if (password.new.length < 8) {
      setPasswordStatus('Password must be at least 8 characters.')
      return
    }
    setPasswordSaving(true)
    try {
      await updateSettings({
        current_password: password.current,
        new_password: password.new,
      })
      setPassword({ current: '', new: '', confirm: '' })
      setPasswordStatus('Password changed successfully.')
    } catch (err) {
      setPasswordStatus(err.message)
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) return <p className="text-slate-500">Loading...</p>

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Link
          to="/admin/posts"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
        >
          <FiArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>
      </div>

      <div className="space-y-8 max-w-2xl">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Display Name</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            This name is shown when you post comments on the blog.
          </p>
          {nameStatus && (
            <p className={`mb-4 text-sm ${nameStatus.startsWith('Display') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {nameStatus}
            </p>
          )}
          <form onSubmit={handleSaveDisplayName} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={settings.username}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              disabled={nameSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              <span>{nameSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-black p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Change Password</h2>
          {passwordStatus && (
            <p className={`mb-4 text-sm ${passwordStatus.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {passwordStatus}
            </p>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Current password</label>
              <input
                type="password"
                value={password.current}
                onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">New password</label>
              <input
                type="password"
                value={password.new}
                onChange={(e) => setPassword((p) => ({ ...p, new: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Confirm new password</label>
              <input
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-black text-slate-800 dark:text-slate-100"
              />
            </div>
            <button
              type="submit"
              disabled={passwordSaving}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {passwordSaving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
