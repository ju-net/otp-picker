import { useState } from 'react'
import { useSettingsStore } from '../store/settings'

function KeywordManager() {
  const { keywords, addKeyword, removeKeyword } = useSettingsStore()
  const [newKeyword, setNewKeyword] = useState('')

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newKeyword.trim()
    if (trimmed && !keywords.includes(trimmed)) {
      addKeyword(trimmed)
      setNewKeyword('')
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <form onSubmit={handleAddKeyword} className="flex gap-2 mb-3">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="キーワードを追加"
        />
        <button
          type="submit"
          disabled={!newKeyword.trim()}
          className="text-sm bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          追加
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
          >
            {keyword}
            <button
              onClick={() => removeKeyword(keyword)}
              className="text-gray-400 hover:text-red-500"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      {keywords.length === 0 && (
        <p className="text-sm text-gray-500">
          キーワードが設定されていません
        </p>
      )}
    </div>
  )
}

export default KeywordManager
