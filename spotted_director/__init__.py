from flask import Flask, render_template, request, redirect, url_for

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
def dashboard():
    return render_template('index.jinja')


@app.route('/server')
def server_list():
    return render_template(
        'server-list.jinja',
        servers=app.config['SERVERS'])


@app.route('/server/<server_name>', methods=['GET', 'POST'])
def server_dashboard(server_name):
    client = get_server_connection(server_name)
    messages = client.list_messages()

    return render_template(
        'server-dashboard.jinja',
        name=server_name,
        host=app.config['SERVERS'][server_name],
        messages=messages)


@app.route('/server/<server_name>/add')
def server_add_message(server_name):
    return render_template(
        'message-add.jinja',
        name=server_name,
        host=app.config['SERVERS'][server_name])


@app.route('/server/<server_name>/action', methods=['POST'])
def server_action(server_name):
    client = get_server_connection(server_name)

    if request.method == 'POST':
        action = request.form['action']

        if action == 'add':
            message = request.form['message']
            client.add_message(message)

        elif action == 'delete':
            message_id = request.form['message_id']
            client.delete_message(message_id)

        else:
            raise ValueError("Unknown action %s" % action)

    return redirect(url_for('server_dashboard', server_name=server_name))
