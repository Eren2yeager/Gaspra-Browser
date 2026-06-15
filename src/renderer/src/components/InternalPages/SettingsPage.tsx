import { useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { Settings as SettingsIcon, RotateCcw, Monitor, Palette, Search, Shield, Download, TrendingUp, Globe } from 'lucide-react'
import { Switch } from '../ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Label } from '../ui/label'
import { Input } from '../ui/input'

export default function SettingsPage() {
  const { settings, isLoading, updateSetting, resetSettings } = useSettings()
  const [activeSection, setActiveSection] = useState('appearance')

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background text-foreground">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background text-foreground">
        <div className="text-muted-foreground">Failed to load settings</div>
      </div>
    )
  }

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'search', label: 'Search', icon: <Search size={16} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={16} /> },
    { id: 'downloads', label: 'Downloads', icon: <Download size={16} /> },
    { id: 'tabs', label: 'Tabs', icon: <TrendingUp size={16} /> },
    { id: 'performance', label: 'Performance', icon: <Monitor size={16} /> },
    { id: 'languages', label: 'Languages', icon: <Globe size={16} /> }
  ]

  return (
    <div className="w-full h-full flex bg-background text-foreground">
      {/* Sidebar Navigation */}
      <div className="w-64 p-6 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon size={20} className="text-primary" />
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-full text-left transition-all
              ${activeSection === section.id
                ? 'bg-primary/10 text-primary bg-muted'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }
            `}
          >
            {section.icon}
            <span className="text-sm font-medium">{section.label}</span>
          </button>
        ))}
        <div className="mt-auto pt-4 border-t border-border">
          <button
            onClick={resetSettings}
            className="
              flex items-center gap-2 w-full px-4 py-3 rounded-full text-sm bg-muted text-foreground font-medium hover:bg-muted active:scale-95
              hover:text-primary hover:bg-primary/10 transition-all
            "
          >
            <RotateCcw size={16} />
            Reset to defaults
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {activeSection === 'appearance' && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Appearance</h2>
            <div className="space-y-8 max-w-2xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="theme">Theme</Label>
                  <div className="text-xs text-muted-foreground">Choose your preferred theme</div>
                </div>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => updateSetting('theme', value as any)}
                >
                  <SelectTrigger id="theme" className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="space-y-0.5">
                  <Label>Accent Color</Label>
                  <div className="text-xs text-muted-foreground">Select your favorite accent color</div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'blue', color: 'bg-blue-500' },
                    { name: 'purple', color: 'bg-purple-500' },
                    { name: 'pink', color: 'bg-pink-500' },
                    { name: 'green', color: 'bg-green-500' },
                    { name: 'orange', color: 'bg-orange-500' },
                    { name: 'red', color: 'bg-red-500' },
                    { name: 'cyan', color: 'bg-cyan-500' },
                    { name: 'yellow', color: 'bg-yellow-500' },
                  ].map((accent) => (
                    <button
                      key={accent.name}
                      onClick={() => updateSetting('accentColor', accent.name as any)}
                      className={`
                        w-12 h-12 rounded-full border-2 transition-all hover:scale-110
                        ${accent.color}
                        ${settings.accentColor === accent.name ? ' scale-110 ring-2 ring-ring ring-offset-2 ring-offset-background' : 'border-transparent'}
                      `}
                      aria-label={`Select ${accent.name} accent`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-6 pt-2 border-t border-border">
                <div className="space-y-0.5">
                  <Label>New Tab Background</Label>
                  <div className="text-xs text-muted-foreground">Customize your new tab page background</div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'none', label: 'None' },
                    { value: 'image', label: 'Image/GIF' },
                    { value: 'video', label: 'Video' },
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => {
                        updateSetting('backgroundType', type.value as any)
                      }}
                      className={`
                        px-4 py-2 rounded-lg border transition-all
                        ${settings.backgroundType === type.value ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent hover:text-accent-foreground'}
                      `}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>

                {settings.backgroundType !== 'none' && (
                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        console.log('SettingsPage: Select file button clicked!')
                        const result = await window.browserAPI.selectFile({
                          filters: [
                            settings.backgroundType === 'image'
                              ? { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'] }
                              : { name: 'Videos', extensions: ['mp4', 'webm', 'ogg'] },
                          ],
                        })
                        console.log('SettingsPage: selectFile result:', result)
                        if (result.success && result.filePath) {
                          console.log('SettingsPage: updating backgroundPath to:', result.filePath)
                          await updateSetting('backgroundPath', result.filePath)
                        }
                      }}
                      className="
                        w-full px-4 py-2 rounded-lg bg-secondary text-secondary-foreground
                        hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2
                      "
                    >
                      Select {settings.backgroundType === 'image' ? 'Image/GIF' : 'Video'}
                    </button>

                    {settings.backgroundPath && (
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground truncate">
                          Selected: {settings.backgroundPath}
                        </div>
                        <button
                          onClick={() => {
                            updateSetting('backgroundPath', null)
                            updateSetting('backgroundType', 'none')
                          }}
                          className="
                            text-xs text-destructive hover:text-destructive/80 underline
                          "
                        >
                          Remove Background
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {activeSection === 'search' && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Search</h2>
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="default-search-engine">Default Search Engine</Label>
                  <div className="text-xs text-muted-foreground">Select your preferred search engine</div>
                </div>
                <Select
                  value={settings.defaultSearchEngine}
                  onValueChange={(value) => updateSetting('defaultSearchEngine', value as any)}
                >
                  <SelectTrigger id="default-search-engine" className="w-[180px]">
                    <SelectValue placeholder="Select engine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="bing">Bing</SelectItem>
                    <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                    <SelectItem value="yahoo">Yahoo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="homepage">Homepage</Label>
                  <div className="text-xs text-muted-foreground">Set your homepage URL</div>
                </div>
                <Input
                  id="homepage"
                  type="text"
                  value={settings.homepage}
                  onChange={(e) => updateSetting('homepage', e.target.value)}
                  className="w-64"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="startup-page">Startup Page</Label>
                  <div className="text-xs text-muted-foreground">Choose what to open on startup</div>
                </div>
                <Select
                  value={settings.startupPage}
                  onValueChange={(value) => updateSetting('startupPage', value as any)}
                >
                  <SelectTrigger id="startup-page" className="w-[180px]">
                    <SelectValue placeholder="Select startup page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newtab">New Tab</SelectItem>
                    <SelectItem value="homepage">Homepage</SelectItem>
                    <SelectItem value="continue">Continue where you left off</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'privacy' && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Privacy</h2>
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="save-history">Save History</Label>
                  <div className="text-xs text-muted-foreground">Keep track of visited websites</div>
                </div>
                <Switch
                  id="save-history"
                  checked={settings.saveHistory}
                  onCheckedChange={(checked) => updateSetting('saveHistory', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="save-download-history">Save Download History</Label>
                  <div className="text-xs text-muted-foreground">Keep track of downloaded files</div>
                </div>
                <Switch
                  id="save-download-history"
                  checked={settings.saveDownloadHistory}
                  onCheckedChange={(checked) => updateSetting('saveDownloadHistory', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="save-search-history">Save Search History</Label>
                  <div className="text-xs text-muted-foreground">Keep track of search queries</div>
                </div>
                <Switch
                  id="save-search-history"
                  checked={settings.saveSearchHistory}
                  onCheckedChange={(checked) => updateSetting('saveSearchHistory', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="block-popups">Block Pop-ups</Label>
                  <div className="text-xs text-muted-foreground">Block unwanted pop-up windows</div>
                </div>
                <Switch
                  id="block-popups"
                  checked={settings.blockPopups}
                  onCheckedChange={(checked) => updateSetting('blockPopups', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-javascript">Enable JavaScript</Label>
                  <div className="text-xs text-muted-foreground">Allow websites to run JavaScript</div>
                </div>
                <Switch
                  id="enable-javascript"
                  checked={settings.enableJavaScript}
                  onCheckedChange={(checked) => updateSetting('enableJavaScript', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-images">Enable Images</Label>
                  <div className="text-xs text-muted-foreground">Load images on web pages</div>
                </div>
                <Switch
                  id="enable-images"
                  checked={settings.enableImages}
                  onCheckedChange={(checked) => updateSetting('enableImages', checked)}
                />
              </div>
            </div>
          </section>
        )}

        {activeSection === 'downloads' && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Downloads</h2>
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="download-path">Download Path</Label>
                  <div className="text-xs text-muted-foreground">Default location for downloaded files</div>
                </div>
                <Input
                  id="download-path"
                  type="text"
                  value={settings.downloadPath}
                  onChange={(e) => updateSetting('downloadPath', e.target.value)}
                  className="w-80"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ask-where-to-save">Ask where to save each file</Label>
                  <div className="text-xs text-muted-foreground">Prompt for download location every time</div>
                </div>
                <Switch
                  id="ask-where-to-save"
                  checked={settings.askWhereToSave}
                  onCheckedChange={(checked) => updateSetting('askWhereToSave', checked)}
                />
              </div>
            </div>
          </section>
        )}

        {activeSection === 'tabs' && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Tabs</h2>
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="save-tabs-on-close">Save Tabs on Close</Label>
                  <div className="text-xs text-muted-foreground">Restore tabs when you reopen the browser</div>
                </div>
                <Switch
                  id="save-tabs-on-close"
                  checked={settings.saveTabsOnClose}
                  onCheckedChange={(checked) => updateSetting('saveTabsOnClose', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="open-new-tab-position">Open New Tab Position</Label>
                  <div className="text-xs text-muted-foreground">Where new tabs should appear</div>
                </div>
                <Select
                  value={settings.openNewTabPosition}
                  onValueChange={(value) => updateSetting('openNewTabPosition', value as any)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="end">End of tab bar</SelectItem>
                    <SelectItem value="after current">After current tab</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="warn-on-close-multiple-tabs">Warn on Closing Multiple Tabs</Label>
                  <div className="text-xs text-muted-foreground">Show warning before closing window with multiple tabs</div>
                </div>
                <Switch
                  id="warn-on-close-multiple-tabs"
                  checked={settings.warnOnCloseMultipleTabs}
                  onCheckedChange={(checked) => updateSetting('warnOnCloseMultipleTabs', checked)}
                />
              </div>
            </div>
          </section>
        )}

        {activeSection === 'performance' && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Performance</h2>
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hardware-acceleration">Hardware Acceleration</Label>
                  <div className="text-xs text-muted-foreground">Use GPU for better performance</div>
                </div>
                <Switch
                  id="hardware-acceleration"
                  checked={settings.hardwareAcceleration}
                  onCheckedChange={(checked) => updateSetting('hardwareAcceleration', checked)}
                />
              </div>
            </div>
          </section>
        )}

        {activeSection === 'languages' && (
          <section>
            <h2 className="text-2xl font-semibold mb-6">Languages</h2>
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="language">Language</Label>
                  <div className="text-xs text-muted-foreground">Select your preferred language</div>
                </div>
                <Select
                  value={settings.language}
                  onValueChange={(value) => updateSetting('language', value)}
                >
                  <SelectTrigger id="language" className="w-[180px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">English (United States)</SelectItem>
                    <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
                    <SelectItem value="es-ES">Spanish (Spain)</SelectItem>
                    <SelectItem value="fr-FR">French (France)</SelectItem>
                    <SelectItem value="de-DE">German (Germany)</SelectItem>
                    <SelectItem value="zh-CN">Chinese (Simplified)</SelectItem>
                    <SelectItem value="ja-JP">Japanese</SelectItem>
                    <SelectItem value="ko-KR">Korean</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
