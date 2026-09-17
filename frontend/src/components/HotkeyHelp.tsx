interface HotkeyHelpProps {
  className?: string
}

const hotkeys = [
  { key: '空格', description: '播放/暂停' },
  { key: 'J', description: '快退10秒' },
  { key: 'K', description: '播放/暂停' },
  { key: 'L', description: '快进10秒' },
  { key: '[', description: '快退5秒' },
  { key: ']', description: '快进5秒' },
]

export default function HotkeyHelp({ className = '' }: HotkeyHelpProps) {
  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <span className="font-medium">快捷键:</span>
      {hotkeys.map((hk, i) => (
        <span key={hk.key} className="ml-2">
          <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded font-mono">
            {hk.key}
          </kbd>
          {' '}{hk.description}
          {i < hotkeys.length - 1 && ' ·'}
        </span>
      ))}
    </div>
  )
}
