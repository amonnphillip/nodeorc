An experiment in making the provisioning of cloud services easier, using Nodejs.

THIS CODE IS VERY ROUGH RIGHT NOW!

Criteria (experiment goals):
Provision in a highly secure manner (NOT DONE)
Use JavaScript, json and Nodejs
Use master -> minions architecture with two way communication (PROTOTYPED. master creates a grpc service server that the minions connect to, then the minions create a service server that the master connects to.)
Configure minions easily, on the fly (NOT DONE)
Change the master configuration easily, on the fly (NOT DONE)
Provision machines in the cloud with specific services, some of which are custom, written in JavaScript (PROTOTYPED. We use grpc service injection from the master, injected into to the minion grpc server)
Injected services need to be secured (NOT DONE)

Architecture choices:
Use grpc for communication
Services are sent from the master to the minions, and are updated on the fly
The master can call a method on a minion service at any time


Notes on grpc, uses, advantages:
grpc (and protobuff) + in memory state database + callable services + scriptable have the following advantages:
I can query all minion machine states, e.g.
  'give me all machines that are low on memory'
  Or
  'give me all machines that have been low on disk space for the past week'

grpc and protobuff and scrips means contract callable services, e.g.
  '30% of machines with the role "web server" call "turn on experimental web site"' <-- You do this from the master and the minions sync, call the method in the service to configure themselves



Service injection notes:
How do I resolve service dependencies? (PROTOTYPED. The minion runs npm install for all service dependencies)
How do I test/debug services? (You test the service individually like you would any NodeJs module)


master:
Git based watch? <- master watches a git repository for changes... Using GIT as a way to manage configurations, that way you get revocation, versioning, branching for free.
Manages minion roles (the minion manages its own state)
Master can set the minion role, on the fly..
Master can call a method on a service on a minion, and change a minion state
NEED: master role js
NEED: events

minion:
Creates services sent from master (service injection).
The 'state' on the minion is both the state of the file system, and the content of an in-memory database
Services may use the in-memory database to store state and query other services state
NEED: events


Other notes:
Logging.. Use bunyan?
