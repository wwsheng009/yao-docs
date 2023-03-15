# List 删除项目后，列表被清空

0.10.3/yao-wms/forms/plan.form.json 这个 form 里使用了 List 控件作为子表保存数据，
当用户删除已有的项目时，会清空整个列表,看起来是一个 bug.
尝试修复如下：
https://github.com/wwsheng009/xgen/commit/c2534e88404166749c66b965aed2bbd99f785333
