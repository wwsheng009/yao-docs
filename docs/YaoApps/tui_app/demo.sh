#!/bin/bash
# TUI 外部数据传递功能演示脚本
# 用于测试和展示 yao tui 的外部数据传入功能

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  TUI 外部数据功能演示${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# 检查是否编译了 yao-tui
if [ ! -f "./yao-tui" ]; then
    echo -e "${YELLOW}警告: yao-tui 未编译，正在编译...${NC}"
    go build -o yao-tui ./cmd/tui
    echo -e "${GREEN}✓ 编译完成${NC}"
fi

echo ""
echo -e "${GREEN}演示场景:${NC}"
echo "1. 使用默认配置启动 TUI"
echo "2. 覆盖标题"
echo "3. 完全覆盖数据"
echo "4. 多个参数合并"
echo "5. 嵌套 JSON 数据"
echo "6. 调试模式"
echo ""

read -p "选择演示场景 (1-6, 0=退出): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}场景 1: 使用默认配置${NC}"
        echo -e "${YELLOW}命令: ./yao-tui external-data-example${NC}"
        echo ""
        read -p "按回车继续..."
        ./yao-tui external-data-example
        ;;
    2)
        echo ""
        echo -e "${BLUE}场景 2: 覆盖标题${NC}"
        echo -e "${YELLOW}命令: ./yao-tui external-data-example :: '{\"title\":\"Custom Title\"}'${NC}"
        echo ""
        read -p "按回车继续..."
        ./yao-tui external-data-example :: '{"title":"Custom Title"}'
        ;;
    3)
        echo ""
        echo -e "${BLUE}场景 3: 完全覆盖数据${NC}"
        echo -e "${YELLOW}命令: ./yao-tui external-data-example :: '{\"title\":\"Full Customize\",\"subtitle\":\"All data external\",\"items\":[\"a\",\"b\",\"c\"]}'${NC}"
        echo ""
        read -p "按回车继续..."
        ./yao-tui external-data-example :: '{"title":"Full Customize","subtitle":"All data external","items":["a","b","c"]}'
        ;;
    4)
        echo ""
        echo -e "${BLUE}场景 4: 多个参数合并${NC}"
        echo -e "${YELLOW}命令: ./yao-tui external-data-example :: '{\"title\":\"First\"}' :: '{\"subtitle\":\"Second\"}' :: '{\"items\":[\"merged1\",\"merged2\"]}'${NC}"
        echo ""
        read -p "按回车继续..."
        ./yao-tui external-data-example :: '{"title":"First"}' :: '{"subtitle":"Second"}' :: '{"items":["merged1","merged2"]}'
        ;;
    5)
        echo ""
        echo -e "${BLUE}场景 5: 嵌套 JSON 数据${NC}"
        echo -e "${YELLOW}命令: ./yao-tui external-data-example :: '{\"title\":\"Nested Data\",\"config\":{\"backgroundColor\":\"blue\",\"textColor\":\"yellow\"}}'${NC}"
        echo ""
        read -p "按回车继续..."
        ./yao-tui external-data-example :: '{"title":"Nested Data","config":{"backgroundColor":"blue","textColor":"yellow"}}'
        ;;
    6)
        echo ""
        echo -e "${BLUE}场景 6: 调试模式${NC}"
        echo -e "${YELLOW}命令: ./yao-tui external-data-example :: '{\"title\":\"Debug Test\"}' --verbose${NC}"
        echo ""
        read -p "按回车继续..."
        ./yao-tui external-data-example :: '{"title":"Debug Test"}' --verbose
        ;;
    0)
        echo "退出"
        ;;
    *)
        echo -e "${YELLOW}无效选择${NC}"
        ;;
esac

echo ""
echo -e "${GREEN}演示结束${NC}"
echo ""
echo "更多示例："
echo "./yao-tui external-data-example :: '{\"title\":\"Quick Test\"}'"
echo "./yao-tui external-data-example :: '{\"title\":\"Test\",\"items\":[1,2,3,4,5]}' --verbose"
echo ""
