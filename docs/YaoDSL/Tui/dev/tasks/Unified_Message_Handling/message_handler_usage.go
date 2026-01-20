package examples

import (
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/yaoapp/yao/tui/core"
)

// 示例：如何使用统一消息处理工具重构 input 组件
//
// 使用直接实现模式重构后的 input 组件示例
// (注意：这是示例代码，实际实现在 tui/components/input.go)
type InputComponentWrapper struct {
	model       textinput.Model // 直接使用原生组件
	props       InputProps      // 组件属性
	id          string          // 组件ID
	bindings    []core.ComponentBinding
	stateHelper *core.InputStateHelper
}

// GetFocus implements [core.InteractiveBehavior].
func (w *InputComponentWrapper) GetFocus() bool {
	panic("unimplemented")
}

// InputProps defines the properties for the Input component
type InputProps struct {
	Placeholder string `json:"placeholder"`
	Value       string `json:"value"`
	Prompt      string `json:"prompt"`
	Color       string `json:"color"`
	Background  string `json:"background"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	Disabled    bool   `json:"disabled"`
	// Bindings define custom key bindings for the component (optional)
	Bindings []core.ComponentBinding `json:"bindings,omitempty"`
}

func (w *InputComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
	// 使用通用消息处理模板
	cmd, response := core.DefaultInteractiveUpdateMsg(
		w,                   // 实现了 InteractiveBehavior 接口的组件
		msg,                 // 接收的消息
		w.getBindings,       // 获取按键绑定的函数
		w.handleBinding,     // 处理按键绑定的函数
		w.delegateToBubbles, // 委托给原 bubbles 组件的函数
	)

	return w, cmd, response
}

// 实现 InteractiveBehavior 接口的方法
func (w *InputComponentWrapper) getBindings() []core.ComponentBinding {
	return w.bindings
}

func (w *InputComponentWrapper) handleBinding(keyMsg tea.KeyMsg, binding core.ComponentBinding) (tea.Cmd, core.Response, bool) {
	// InputComponentWrapper 已经实现了 ComponentWrapper 接口，可以直接传递
	cmd, response, handled := core.HandleBinding(w, keyMsg, binding)
	return cmd, response, handled
}

func (w *InputComponentWrapper) delegateToBubbles(msg tea.Msg) tea.Cmd {
	var cmd tea.Cmd

	// 处理按键消息
	if keyMsg, ok := msg.(tea.KeyMsg); ok {
		// 跳过已在 HandleSpecialKey 中处理的键
		switch keyMsg.Type {
		case tea.KeyTab, tea.KeyEscape:
			// 这些键已由 HandleSpecialKey 处理，跳过委托
			return nil
		case tea.KeyEnter:
			// 特殊处理Enter键
			w.model, cmd = w.model.Update(msg)

			// 发布Enter按下事件
			enterCmd := core.PublishEvent(w.id, core.EventInputEnterPressed, map[string]interface{}{
				"value": w.model.Value(),
			})

			// 合并命令（如果有的话）
			if cmd != nil {
				return tea.Batch(enterCmd, cmd)
			}
			return enterCmd
		default:
			// 处理其他按键（包括字符输入）
			w.model, cmd = w.model.Update(msg)
			return cmd // 可能为 nil
		}
	}

	// 处理非按键消息
	w.model, cmd = w.model.Update(msg)
	return cmd // 可能为 nil
}

// 实现 StateCapturable 接口
func (w *InputComponentWrapper) CaptureState() map[string]interface{} {
	return w.stateHelper.CaptureState()
}

func (w *InputComponentWrapper) DetectStateChanges(old, new map[string]interface{}) []tea.Cmd {
	return w.stateHelper.DetectStateChanges(old, new)
}

// 实现 HandleSpecialKey 方法
func (w *InputComponentWrapper) HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, core.Response, bool) {
	switch keyMsg.Type {
	case tea.KeyTab:
		// 让Tab键冒泡以处理组件导航
		return nil, core.Ignored, true
	case tea.KeyEscape:
		// 失焦处理
		w.model.Blur()
		cmd := core.PublishEvent(w.id, core.EventEscapePressed, nil)
		return cmd, core.Ignored, true
	}

	// 其他按键不由这个函数处理
	return nil, core.Ignored, false
}

// 实现 HasFocus 方法
func (w *InputComponentWrapper) HasFocus() bool {
	return w.model.Focused()
}

// 以下是 InputComponentWrapper 实现 ComponentInterface 和其他接口所需的方法
func (w *InputComponentWrapper) Init() tea.Cmd {
	return nil
}

func (w *InputComponentWrapper) View() string {
	return w.model.View()
}

func (w *InputComponentWrapper) GetModel() interface{} {
	return w.model
}

func (w *InputComponentWrapper) GetID() string {
	return w.id
}

func (w *InputComponentWrapper) ExecuteAction(action *core.Action) tea.Cmd {
	// 示例实现
	return nil
}

func (w *InputComponentWrapper) GetComponentType() string {
	return "input"
}

func (w *InputComponentWrapper) Render(config core.RenderConfig) (string, error) {
	return w.model.View(), nil
}

func (w *InputComponentWrapper) UpdateRenderConfig(config core.RenderConfig) error {
	return nil
}

func (w *InputComponentWrapper) Cleanup() {
	// 示例实现
}

func (w *InputComponentWrapper) GetStateChanges() (map[string]interface{}, bool) {
	return nil, false
}

func (w *InputComponentWrapper) GetSubscribedMessageTypes() []string {
	return []string{"tea.KeyMsg", "core.TargetedMsg"}
}

func (w *InputComponentWrapper) SetFocus(focus bool) {
	if focus {
		w.model.Focus()
	} else {
		w.model.Blur()
	}
}

func (w *InputComponentWrapper) PublishEvent(sourceID, eventName string, payload map[string]interface{}) tea.Cmd {
	return core.PublishEvent(sourceID, eventName, payload)
}

// ListComponentWrapper 模拟类型定义
// (注意：这是示例代码，实际实现在 tui/components/list.go)
type ListComponentWrapper struct {
	// 模拟 List 组件的字段
}

// GetFocus implements [core.InteractiveBehavior].
func (w *ListComponentWrapper) GetFocus() bool {
	return w.HasFocus()
}

// 使用统一消息处理工具重构后的 list 组件示例
// (注意：这是示例代码，实际实现在 tui/components/list.go)
func (w *ListComponentWrapper) UpdateMsg(msg tea.Msg) (core.ComponentInterface, tea.Cmd, core.Response) {
	// 使用通用消息处理模板
	cmd, response := core.DefaultInteractiveUpdateMsg(
		w, // 实现了 InteractiveBehavior 接口的组件
		msg,
		w.getBindings,       // 获取按键绑定的函数
		w.handleBinding,     // 处理按键绑定的函数
		w.delegateToBubbles, // 委托给原 bubbles 组件的函数
	)

	return w, cmd, response
}

// 为 ListComponentWrapper 实现必要的方法
func (w *ListComponentWrapper) getBindings() []core.ComponentBinding {
	// 示例实现
	return nil
}

func (w *ListComponentWrapper) handleBinding(keyMsg tea.KeyMsg, binding core.ComponentBinding) (tea.Cmd, core.Response, bool) {
	// 示例实现
	cmd, response, handled := core.HandleBinding(w, keyMsg, binding)
	return cmd, response, handled
}

func (w *ListComponentWrapper) delegateToBubbles(msg tea.Msg) tea.Cmd {
	// 示例实现
	return nil
}

// ListComponentWrapper 实现所需接口的方法
func (w *ListComponentWrapper) CaptureState() map[string]interface{} {
	// 示例实现
	return nil
}

func (w *ListComponentWrapper) DetectStateChanges(old, new map[string]interface{}) []tea.Cmd {
	// 示例实现
	return nil
}

func (w *ListComponentWrapper) HandleSpecialKey(keyMsg tea.KeyMsg) (tea.Cmd, core.Response, bool) {
	// 示例实现
	return nil, core.Ignored, false
}

func (w *ListComponentWrapper) HasFocus() bool {
	// 示例实现
	return false
}

// ComponentInterface 实现
func (w *ListComponentWrapper) Init() tea.Cmd {
	return nil
}

func (w *ListComponentWrapper) View() string {
	return "list view"
}

func (w *ListComponentWrapper) GetModel() interface{} {
	return nil
}

func (w *ListComponentWrapper) GetID() string {
	return "list"
}

func (w *ListComponentWrapper) ExecuteAction(action *core.Action) tea.Cmd {
	return nil
}

func (w *ListComponentWrapper) GetComponentType() string {
	return "list"
}

func (w *ListComponentWrapper) Render(config core.RenderConfig) (string, error) {
	return "list view", nil
}

func (w *ListComponentWrapper) UpdateRenderConfig(config core.RenderConfig) error {
	return nil
}

func (w *ListComponentWrapper) Cleanup() {
	// 示例实现
}

func (w *ListComponentWrapper) GetStateChanges() (map[string]interface{}, bool) {
	return nil, false
}

func (w *ListComponentWrapper) GetSubscribedMessageTypes() []string {
	return []string{"tea.KeyMsg", "core.TargetedMsg"}
}

func (w *ListComponentWrapper) SetFocus(focus bool) {
	// 示例实现
}

func (w *ListComponentWrapper) PublishEvent(sourceID, eventName string, payload map[string]interface{}) tea.Cmd {
	return core.PublishEvent(sourceID, eventName, payload)
}

// 重构前 vs 重构后对比
/*
重构前（原始 input 组件 UpdateMsg）：
- 70+ 行代码
- 手动实现所有层逻辑
- 重复的状态检测代码
- 分散的事件发布逻辑

重构后（使用统一消息处理工具）：
- 20-25 行核心代码
- 复用通用模板
- 标准化的状态检测
- 统一的事件发布模式
*/
