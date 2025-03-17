# Express Microservices Demo

## Requirements
    * kubectl
    * minikube

## Run kafka on k8s
    * start minikube
    * kubectl apply -f k8s/kafka-deployment.yaml
    
## Send messages 
    1. run the express api with `pnpm dev`
    2. port forward traffic from localhsot to kafka service:
    `kubectl port-forward svc/kafka 9092:9092`
    3. `curl http://localhost:3000/send-message\?message\=hello`
    4. open shell inside kafka pod:
    `kubectl exec -it <kafka-pod-name> -- sh -c 'cd /opt/kafka/bin/ && sh'`
    4. check message in kafka pod with:
    `/opt/kafka/bin $ ./kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-topic --from-beginning --partition=0`


## Todo
    * create k8s deployment for the express api app.
    * use ingress controller:
    `kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
`
    * apply the ingress resource:
    `kubectl apply -f express-api-ingress.yaml`
