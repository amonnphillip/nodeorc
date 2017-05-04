const grpc = require('grpc');
const loki = require('lokijs');
const path = require('path');
const dns = require('dns');
const fs = require('fs');

const MASTER_ROLE = 'master';

const CONFIG_JSON_FILE_NAME = 'config.roles.json';

class nodeorcMaster {
  constructor(rolesConfigPath) {
    this.configPath = path.resolve(rolesConfigPath);
    this.configRoles = require(path.resolve(this.configPath + '/' + CONFIG_JSON_FILE_NAME));
    this.db = new loki('nodeorcdb.json');
    this.minionCollection = this.db.addCollection('minions');

    // The list of connections to the minion servers
    this.minionServers = [];
  }

  initialize() {
    return new Promise((resolve, reject) => {
      dns.lookupService('127.0.0.1', 22, (err, hostname, service) => {
        console.log(hostname, service);
        // Prints: localhost ssh
      });
    });
  }

  get roles() {
    return this.configRoles;
  }

  shutdown() {
    if (typeof this.db !== 'undefiined') {
      this.db.saveDatabase();
    }
  }

  getRole(roleName) {
    let foundRole = null;
    this.configRoles.forEach(function(role) {
      if (role.role === roleName) {
        foundRole = role;
      }
    });

    return foundRole;
  }

  getServiceForRole(role) {
    return role.services[0]; // TODO: RIGHT NOW WE HAVE MULTIPLE SERVICES
  }

  /**
   * Loads the script and the proto file for the role
   * @param role
   */
  resolveRoleScript(role) {

    let service = this.getServiceForRole(role); // TODO: NEED TO COMPARE IF IT IS RESOLVED ALREADY

    let scriptFileName = path.basename(service.script);
    let protoFileName = path.basename(service.proto);
    let script = fs.readFileSync(path.resolve(this.configPath + '/' + service.script));
    let proto = fs.readFileSync(path.resolve(this.configPath + '/' + service.proto));

    return {
      serviceName: service.name,
      packageName: service.packageName,
      scriptFileName: scriptFileName,
      protoFileName: protoFileName,
      scriptContent: script,
      protoContent: proto
    }
  }
/*
  // TODO: MAYBE NOT NEEDED!!!!!!!!!
  getRoleForaddress(address, port) {
    let foundRole = null;
    let addressAndPort = address;
    if (typeof port !== 'undefined' &&
      port !== null &&
      port !== '') {
      addressAndPort += ':' + port;
    }
    this.configRoles.forEach(function(role) {
      if (role.address === addressAndPort) {
        foundRole = role;
      }
    });

    return foundRole;
  }*/

  getMasterRole() {
    return this.getRole(MASTER_ROLE);
  }

  countActiveRoles() {
    let activeRoles = {};
    let totalRoles = 0;
    this.configRoles.forEach((role) => {
      let results = this.minionCollection.find({'Name': {'$eq': role.role}});
      activeRoles[role.role] = results.length;
      totalRoles += results.length;
    });

    activeRoles.totalRoles = totalRoles;

    return activeRoles;
  }

  getRoleConfig(roleName) {
    let foundRole = null;
    this.configRoles.forEach(function(role) {
      if (role.role === roleName) {
        foundRole = role;
      }
    });

    return foundRole;
  }

  start() {
    this.masterservice_proto = grpc.load('./proto/master.proto').masterservice;

    this.server = new grpc.Server();
    this.server.addService(this.masterservice_proto.MasterService.service, {
      getRole: (call, callback) => {
        console.log('Minion: ' + call.request.address + ' ' + call.request.port);
        let role = this.getRoleForaddress(call.request.address, call.request.port);
        callback(null, {roleName: role.role});
      },
      registerMinion: (call, callback) => {
        let adress = call.getPeer();

        console.log('registerMinion: ' + adress + ' role: ' + call.request.role);


        let role = this.getRoleConfig(call.request.roleName);
        if (role !== null) {
          callback(null, this.resolveRoleScript(role));
        } else {
          throw "role not found";
        }
      },
      minionServerCreated: (call, callback) => {
        // Create client to this server and connect
        let role = this.getRoleConfig(call.request.role);
        if (role === null) {
          throw "role not found";
        }

        let service = role.services[0]; // TODO: RESOLVE SERVICE BY NAME

        let service_proto = grpc.load(path.resolve(this.configPath + '/' + service.proto))[service.packageName];

        let client = new service_proto[service.name](call.request.addressAndPort, grpc.credentials.createInsecure());
        this.minionServers.push(client);

        setTimeout(() => {
          client.getMessage({message: 'message from the server'}, (err, response) => {
            console.log('Called the web service!');
          })
        }, 1000);
      }
    });

    this.server.bind('localhost:50051', grpc.ServerCredentials.createInsecure());
    this.server.start();
  }

  doClientCall() {
    console.log('this:' + this);
    console.log('this.minionServers:' + this.minionServers);
    console.log('this.minionServers[0]:' + this.minionServers[0]);
    this.minionServers[0].getMessage('!', (err, response) => {
      console.log('');
    })
  }
}

module.exports = nodeorcMaster;