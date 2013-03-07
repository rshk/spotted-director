from flask import Flask, render_template, request, redirect, url_for, json, make_response

app = Flask(__name__)


def get_server_connection(server_name):
    ## We import zerorpc here to prevent this:
    ## "NotImplementedError: gevent is only usable from a single thread"
    import zerorpc
    url = app.config['SERVERS'][server_name]
    client = zerorpc.Client()
    client.connect(url)
    return client


@app.route('/')
@app.route('/<path:path>')
def dashboard(path=None):
    return render_template('index.jinja')

# @app.route('/server')
# def server_list():
#     return render_template(
#         'server-list.jinja',
#         servers=app.config['SERVERS'])
#
#
# @app.route('/server/<server_name>', methods=['GET', 'POST'])
# def server_dashboard(server_name):
#     client = get_server_connection(server_name)
#     messages = client.list_messages()
#
#     return render_template(
#         'server-dashboard.jinja',
#         name=server_name,
#         host=app.config['SERVERS'][server_name],
#         messages=messages)
#
#
# @app.route('/server/<server_name>/add')
# def server_add_message(server_name):
#     return render_template(
#         'message-add.jinja',
#         name=server_name,
#         host=app.config['SERVERS'][server_name])
#
#
# @app.route('/server/<server_name>/action', methods=['POST'])
# def server_action(server_name):
#     client = get_server_connection(server_name)
#
#     if request.method == 'POST':
#         action = request.form['action']
#
#         if action == 'add':
#             message = request.form['message']
#             client.add_message(message)
#
#         elif action == 'delete':
#             message_id = request.form['message_id']
#             client.delete_message(message_id)
#
#         else:
#             raise ValueError("Unknown action %s" % action)
#
#     return redirect(url_for('server_dashboard', server_name=server_name))

## ===== API views =============================================================
## Objects: server, screen_message(server), queue_message
## URLs:

def _json_response(data):
    response = make_response(json.dumps(data))
    response.headers['Content-type'] = 'application/json'
    return response

## GET /server/
## List servers
@app.route('/api/server', methods=['GET'])
def api_get_server():
    servers = []
    for server_id, server in app.config['SERVERS'].iteritems():
        servers.append({
            'id': server_id,
            'url': server,
        })
    return _json_response(servers)

## POST /server/
## Add a server connection
@app.route('/api/server', methods=['POST'])
def api_post_server():
    assert request.content_type == 'application/json'
    data = json.loads(request.data)
    assert 'url' in data
    server_id = data['id'] if 'id' in data else data['url']
    assert server_id not in app.config['SERVERS']
    app.config['SERVERS'][server_id] = data['url']

## GET /server/<id>
## Get info on a server connection
@app.route('/api/server/<server_id>', methods=['GET'])
def api_get_server_id(server_id):
    server = app.config['SERVERS'][server_id]
    return _json_response({
        'id': server_id,
        'url': server,
    })

## GET /server/<id>/status
## Get server status
@app.route('/api/server/<server_id>/status', methods=['GET'])
def api_get_server_id_status(server_id):
    client = get_server_connection(server_id)
    return _json_response(client.server_info())

## PUT /server/<id>
@app.route('/api/server/<server_id>', methods=['PUT'])
def api_put_server_id(server_id):
    assert server_id in app.config['SERVERS']
    assert request.content_type == 'application/json'
    data = json.loads(request.data)
    assert 'url' in data
    app.config['SERVERS'][server_id] = data['url']

## DELETE /server/<id>
## Delete a server connection
@app.route('/api/server/<server_id>', methods=['DELETE'])
def api_delete_server_id(server_id):
    assert server_id in app.config['SERVERS']
    del app.config['SERVERS'][server_id]

## GET /server/<id>/message
## List messages on a screen
@app.route('/api/server/<server_id>/message', methods=['GET'])
def api_get_server_id_message(server_id):
    client = get_server_connection(server_id)
    return _json_response(client.list_messages())

## POST /server/<id>/message
## Add a message to a screen
@app.route('/api/server/<server_id>/message', methods=['POST'])
def api_post_server_id_message(server_id):
    assert request.content_type == 'application/json'
    data = json.loads(request.data)
    client = get_server_connection(server_id)
    return _json_response(client.add_message(data['text'], color=data.get('color')))

## GET /server/<id>/message/<id>
## Get a specific message from a screen
@app.route('/api/server/<server_id>/message/<message_id>', methods=['GET'])
def api_get_server_id_message_id(server_id, message_id):
    client = get_server_connection(server_id)
    return _json_response(client.get_message(message_id))

## PUT /server/<id>/message/<id>
@app.route('/api/server/<server_id>/message/<message_id>', methods=['PUT'])
def api_put_server_id_message_id(server_id, message_id):
    client = get_server_connection(server_id)
    pass  # todo: implement the update method

## DELETE /server/<id>/message/<id>
@app.route('/api/server/<server_id>/message/<message_id>', methods=['DELETE'])
def api_delete_server_id_message_id(server_id, message_id):
    client = get_server_connection(server_id)
    client.delete_message(message_id)

## GET /queue
@app.route('/api/queue', methods=['GET'])
def api_get_queue():
    pass  # todo: write this

## POST /queue
## Add something to the queue (useful?)
@app.route('/api/queue', methods=['POST'])
def api_post_queue():
    pass  # todo: write this

## GET /queue/<id>
@app.route('/api/queue/<queue_id>', methods=['GET'])
def api_get_queue_id(queue_id):
    pass  # todo: write this

## PUT /queue/<id>
## Perform an action on a queue item (including approval)
@app.route('/api/queue/<queue_id>', methods=['PUT'])
def api_put_queue_id(queue_id):
    pass  # todo: write this

## DELETE /queue/<id>
## Delete an item from the queue
@app.route('/api/queue/<queue_id>', methods=['DELETE'])
def api_delete_queue_id(queue_id):
    pass  # todo: write this
