from crewai.tools import tool
from .http import get_http_tool, add_pending, record_tool_call, record_tool_result, _safe_summary


@tool("list_customers")
def list_customers(query: str = "", sort: str = "ltv", limit: int = 10, tag: str = "") -> str:
    """Search and list customers. sort can be 'ltv', 'createdAt', 'lastOrderAt'. query searches name/email. limit max 100."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    params = {'search': query, 'sort': sort, 'limit': min(limit or 10, 100), 'tag': tag}
    record_tool_call('list_customers', {k: v for k, v in params.items() if v not in (None, "")})
    try:
        data = http.get('/api/customers', params=params)
        record_tool_result('list_customers', data)
        return _safe_summary('customers', data)
    except Exception as e:
        return f'Error: {e}'


@tool("get_customer")
def get_customer(id: str) -> str:
    """Fetch a single customer by Mongo _id."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_customer', {'id': id})
    try:
        data = http.get(f'/api/customers/{id}')
        record_tool_result('get_customer', data)
        return _safe_summary('customer', data)
    except Exception as e:
        return f'Error: {e}'


@tool("get_customer_distributions")
def get_customer_distributions() -> str:
    """Get aggregated customer distribution metrics across city, gender, age, LTV buckets."""
    http = get_http_tool()
    if not http:
        return 'Error: backend not initialized'
    record_tool_call('get_customer_distributions', {})
    try:
        data = http.get('/api/customers/distributions')
        record_tool_result('get_customer_distributions', data)
        return _safe_summary('distributions', data)
    except Exception as e:
        return f'Error: {e}'


@tool("create_customer")
def create_customer(name: str, email: str, phone: str = "", city: str = "", tags: str = "") -> str:
    """Propose creating a new customer. Requires user approval. tags is a comma-separated list."""
    params = {'name': name, 'email': email}
    if phone:
        params['phone'] = phone
    if city:
        params['city'] = city
    if tags:
        params['tags'] = [t.strip() for t in tags.split(',') if t.strip()]
    add_pending('create_customer', params, f"Create customer '{name}' ({email})")
    return f"Pending user approval: create customer '{name}'."


@tool("delete_customer")
def delete_customer(id: str) -> str:
    """Propose deleting a customer by Mongo _id. Requires user approval."""
    add_pending('delete_customer', {'id': id}, f"Delete customer {id}")
    return f"Pending user approval: delete customer {id}."
