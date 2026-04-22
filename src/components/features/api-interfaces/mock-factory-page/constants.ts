export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_HISTORY_PAGE_SIZE = 10;
export const SEARCH_DEBOUNCE_DELAY = 500;

// 默认 Python 脚本模板
export const DEFAULT_PYTHON_SCRIPT = `def mock_response(req: dict) -> dict:
    param = req.get('param', {})
    return {
        "code": 200,
        "data": {
        }
    }`;

export const RESPONSE_TYPES = ['String', 'Object', 'List', 'Int', 'Boolean', 'python_script'] as const;
export const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;
export const RULE_TYPES = ['HTTP', 'DUBBO'] as const;
