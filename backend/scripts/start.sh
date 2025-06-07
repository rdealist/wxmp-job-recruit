#!/bin/bash

# 工程招聘小程序后端启动脚本
# 作者: 工程招聘小程序团队
# 创建时间: 2024-12-05

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查Node.js版本
check_node_version() {
    log_info "检查Node.js版本..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js未安装，请先安装Node.js 16.0.0或更高版本"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    REQUIRED_VERSION="16.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        log_error "Node.js版本过低，当前版本: $NODE_VERSION，要求版本: $REQUIRED_VERSION+"
        exit 1
    fi
    
    log_success "Node.js版本检查通过: $NODE_VERSION"
}

# 检查npm版本
check_npm_version() {
    log_info "检查npm版本..."
    
    if ! command -v npm &> /dev/null; then
        log_error "npm未安装"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    log_success "npm版本: $NPM_VERSION"
}

# 检查环境配置文件
check_env_file() {
    log_info "检查环境配置文件..."
    
    if [ ! -f ".env" ]; then
        log_warning ".env文件不存在，正在从.env.example创建..."
        
        if [ -f ".env.example" ]; then
            cp .env.example .env
            log_warning "请编辑.env文件并填入正确的配置值"
            log_warning "配置完成后重新运行此脚本"
            exit 1
        else
            log_error ".env.example文件不存在"
            exit 1
        fi
    fi
    
    log_success "环境配置文件检查通过"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        log_success "依赖安装完成"
    else
        log_info "检查依赖更新..."
        npm ci
        log_success "依赖检查完成"
    fi
}

# 检查数据库连接
check_database() {
    log_info "检查数据库连接..."
    
    # 这里可以添加数据库连接检查逻辑
    # 暂时跳过，在应用启动时会自动检查
    
    log_success "数据库连接检查跳过（将在应用启动时检查）"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    mkdir -p logs
    mkdir -p temp
    mkdir -p uploads
    
    log_success "目录创建完成"
}

# 启动应用
start_application() {
    local mode=${1:-"development"}
    
    log_info "启动应用 (模式: $mode)..."
    
    case $mode in
        "development"|"dev")
            log_info "启动开发模式..."
            npm run dev
            ;;
        "production"|"prod")
            log_info "启动生产模式..."
            npm start
            ;;
        "pm2")
            log_info "使用PM2启动..."
            if ! command -v pm2 &> /dev/null; then
                log_error "PM2未安装，请先安装: npm install -g pm2"
                exit 1
            fi
            pm2 start src/app.js --name job-recruit-backend
            pm2 save
            log_success "PM2启动完成"
            ;;
        *)
            log_error "未知的启动模式: $mode"
            log_info "支持的模式: development, production, pm2"
            exit 1
            ;;
    esac
}

# 显示帮助信息
show_help() {
    echo "工程招聘小程序后端启动脚本"
    echo ""
    echo "用法: $0 [模式]"
    echo ""
    echo "模式:"
    echo "  development, dev  - 开发模式 (默认)"
    echo "  production, prod  - 生产模式"
    echo "  pm2              - PM2进程管理模式"
    echo "  help, -h, --help - 显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                # 开发模式启动"
    echo "  $0 dev           # 开发模式启动"
    echo "  $0 production    # 生产模式启动"
    echo "  $0 pm2           # PM2模式启动"
}

# 主函数
main() {
    local mode=${1:-"development"}
    
    # 显示帮助信息
    if [ "$mode" = "help" ] || [ "$mode" = "-h" ] || [ "$mode" = "--help" ]; then
        show_help
        exit 0
    fi
    
    log_info "开始启动工程招聘小程序后端服务..."
    
    # 执行检查和准备步骤
    check_node_version
    check_npm_version
    check_env_file
    install_dependencies
    check_database
    create_directories
    
    # 启动应用
    start_application "$mode"
}

# 脚本入口
main "$@"
