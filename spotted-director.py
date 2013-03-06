#!/usr/bin/env python

from flask import Flask, render_template
import zerorpc

app = Flask(__name__)


SERVERS = {}  # { name: url }


@app.route('/')
def dashboard():
    return render_template('index.jinja')


@app.route('/server')
def server_list():
    return render_template('server-list.jinja', servers=SERVERS)


@app.route('/server/<server_name>')
def server_dashboard(server_name):
    return render_template('server-dashboard.jinja',
                           name=server_name,
                           host=SERVERS[server_name])


@app.route('/server/<server_name>/add')
def server_add_message(server_name):
    return render_template('message-add.jinja',
                           name=server_name,
                           host=SERVERS[server_name])


if __name__ == '__main__':
    import optparse
    parser = optparse.OptionParser()
    parser.add_option('--debug', action='store_true', dest='debug',
                      default=False)
    parser.add_option('--host', action='store', dest='host',
                      default='127.0.0.1',
                      help="Listen address for the director")
    parser.add_option('--port', action='store', dest='port', default=5000,
                      type='int',
                      help="Listen port for the director")
    parser.add_option('--wall', action='append', dest='wall_address',
                      help="Specify wall server to which to connect."
                           "Can be passed multiple times."
                           "Must be a valid ZeroMQ URL."
                           "A name can be added using the form:"
                           "name!url")
    options, args = parser.parse_args()

    for wall_address in options.wall_address:
        if '!' in wall_address:
            name, url = wall_address.split('!', 1)
        else:
            name, url = wall_address, wall_address
        SERVERS[name] = url

    app.run(host=options.host,
            port=options.port,
            debug=options.debug)
