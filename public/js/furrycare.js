var furrycareApp = angular.module("furrycareApp",['ngCookies','ngRoute']);

furrycareApp.config(function($routeProvider){
      $routeProvider
          .when('/animal',{
                templateUrl: 'pages/animal.html',
                controller: 'animalCtrl'
          })
          .when('/notification',{
                templateUrl: 'pages/notification.html',
                controller: 'notificationCtrl'
          })
          .when('/new_animal',{
                templateUrl: 'pages/new_animal.html',
                controller: 'animalCtrl'
          });
         /* .otherwise({
                redirectTo : 'pages/home'
          });*/          
});

furrycareApp.controller('userCtrl', ['$scope','$rootScope','$http','$cookies','$cookieStore','$window','$location',
                                                    function ($scope,$rootScope,$http,$cookies,$cookieStore,$window,$location) {   
// https://final-ws-furrycare.herokuapp.com
    $scope.page = 'animal';

    $scope.isUserLogedIn = function() {
        //console.log("on logedIn...");
        if (typeof $cookies.userMail !== 'undefined') 
            return true;
        return false;
    };
    /* reset all edit fields and opened scroll lists about current animal */
    $scope.resetEditFields = function() {
        $scope.currAnimal.editname = false;
        $scope.currAnimal.editage = false;
        $scope.currAnimal.editweight = false;
        $scope.currAnimal.vaccOpened = undefined;
        $scope.currAnimal.foodOpened = undefined;
        $scope.currAnimal.careOpened = undefined; 
    };
    $scope.updateCurrentAnimal = function(first_or_last) { 
        var len = $scope.user.animals.length;    
        if (len <= 1) {
            $scope.currAnimal = $scope.user.animals[0]; 
            return;
        }
        if (first_or_last === "first") // len > 1
            $scope.currAnimal = $scope.user.animals[0];
        else {
            console.log("on updateCurrentAnimal else... len is : "+len);
            $scope.currAnimal = $scope.user.animals[len-1];
        }
        $scope.resetEditFields();
        console.log("curr animal name: "+$scope.currAnimal.animalName);
    };
    $scope.getUser = function() {
        console.log("getUser is called!!! so the user is updated!");
        $http.get('http://localhost:3000/getUser?userMail='+$cookies.userMail).success(function (data) {
            console.log(data);
            $scope.user = data;
            console.log("user name : "+$scope.user.userName);
            //if ( typeof $scope.user.animals !== 'undefined') {
            $scope.updateCurrentAnimal("first");        
        });
    };
    $scope.tries = 0; // need enter to func login()
    $scope.login = function() {    
        console.log("mail: "+ $scope.user.email);
        console.log("pass: "+ $scope.user.pass);
        console.log("try number: "+$scope.tries);       

        $http.get('http://localhost:3000/getUser?userMail='+$scope.user.email)
            .success(function (data){
                console.log("login...");
                console.log("data(user) returned from ws ");  
                console.log(data);
                
                if (data == null) {
                    alert("There is no such email in the system. move to sign in.");
                    // delete history
                    $location.path("/error"); // sign in ?
                } else {
                    console.log(data.email);
                    console.log(data.pass);
                    console.log($scope.user.pass);
                    if (data.pass === $scope.user.pass)  {
                        // delete history                     
                        $cookies.userMail = data.email;
                        console.log("FROM LOGIN- COOKIE : "+$cookies.userMail);
                        // need it ?
                        $scope.user = data;
                        $scope.updateCurrentAnimal("first");
                        $scope.newAnimalClicked = false;
                        $location.path("/animal");
                    } else {
                         alert("incorrect password.");
                         //clear input
                         $scope.user.pass = "";
                         // increament number of tries
                         $scope.tries +=1;
                         if ($scope.tries >= 3) {
                            alert("You have been tring too many times.\nYou can try login again later..");
                            // delete history
                            $location.path("/error");
                         }
                     }
                }    
        });
    };
    $scope.initUserCtrl = function() {
        console.log("in userCtrl");
        if ($scope.isUserLogedIn()) {
            $scope.getUser();
            $scope.newAnimalClicked = false;
            $location.path("/animal");
        }
        /* else
            $scope.login(); */
    };

    $scope.initUserCtrl();
    
    $scope.isThisPageActive = function (pageName) {
        return $scope.page === pageName;
    };
    $scope.editWithoutDoneFixed = function() {
    /* the situation is that edit button pressed and maybe the field was changed,
        but the 'done' button wasn't pressed, so the change won't save to db.
        We want to return the previos name without refreshing the page so we do that. 
    */
        if ($scope.currAnimal.editname == true)
            $scope.currAnimal.animalName = $scope.currAnimal.pre_name;  
        if ($scope.currAnimal.editage == true)
            $scope.currAnimal.animalAge = $scope.currAnimal.pre_age;
        if ($scope.currAnimal.editweight == true)
            $scope.currAnimal.animalWeight = $scope.currAnimal.pre_weight;
    };
    $scope.selectedPage = function (pageName) {
        $scope.page = pageName;
        // if we are in noti page, and someone change the db from mongo directly.
        // we will come back to animal page and the data won't be updated.
        // if we want he will be update we need to call : getUser (include inside the update)
        // if not, just updateCurrentAnimal
        //$scope.updateCurrentAnimal("first");

        $scope.user = $scope.getUser();
        $scope.newAnimalClicked = false;
        $location.path("/"+$scope.page);
    };
    $scope.checkSelectedAnimal = function(id) {
        //console.log("id= "+id);
        if (!$scope.newAnimalClicked) { // if we are not in new_animal page
            angular.forEach($scope.user.animals, function(animal) {
                if (animal._id == id) {
                    $scope.editWithoutDoneFixed();
                    $scope.currAnimal = animal;
                    $scope.resetEditFields();
                } 
            });
        }
    };
    $scope.isThisAnimalActive = function(nowSelectedAnimalLink) {
        if ($scope.newAnimalClicked)
            return false;
        return $scope.currAnimal._id === nowSelectedAnimalLink;
    };
    $scope.moveToAddNewAnimalPage = function() {
        console.log("moveToAddNewAnimalPage");
        $scope.newAnimalClicked = true;
        $location.path("/new_animal");
    };

}]);

furrycareApp.controller('animalCtrl', ['$scope','$rootScope','$http','$cookies','$cookieStore','$window','$location',
                                                    function ($scope,$rootScope,$http,$cookies,$cookieStore,$window,$location) {                      

    $scope.resetFoodNewObj = function() {
        $scope.food = {
            foodName : '',
            foodBrand : '',
            foodBagWeight : '',
            foodBagPrice : '',
            foodDailyUsage : '',
            foodDate : '',
            foodItemClickedVar : false
        };
    };
    $scope.resetVaccNewObj = function() {
        $scope.vacc = {
            vaccName : '',
            vaccDate : '',
            vaccExp : '',
            vaccItemClickedVar : false
        };
    };
    $scope.resetCareNewObj = function() {
        $scope.care = {
            careType : '',
            careDate : '',
            careExp : '',
            careItemClickedVar : false
        };
    };
    
    $scope.resetFoodNewObj();
    $scope.resetVaccNewObj();
    $scope.resetCareNewObj();

    // this just for the first time..
    if (typeof $scope.$parent.currAnimal === 'undefined') {
        $scope.$parent.currAnimal = {
            editname : false,
            editage : false,
            editweight : false,
            vaccOpened : undefined,
            foodOpened : undefined,
            careOpened : undefined
        };
    }
    /* edit button of simple detail of current animal was clicked : name/age/weight */
    $scope.editDetailClicked = function(detail) {
        console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$");
        console.log(detail);


        if (detail === "animalName") {
            //console.log("curr animal name: "+$scope.currAnimal.animalName);
            $scope.$parent.currAnimal.pre_name = $scope.$parent.currAnimal.animalName;
            $scope.$parent.currAnimal.editname = true;
            console.log($scope.$parent.currAnimal.editname);
            return;
        }
        if (detail === "animalAge") {
            $scope.$parent.currAnimal.pre_age = $scope.$parent.currAnimal.animalAge;
            $scope.$parent.currAnimal.editage = true;
            return;
        }
        if (detail === "animalWeight") {
            $scope.$parent.currAnimal.pre_weight = $scope.$parent.currAnimal.animalWeight;
            $scope.$parent.currAnimal.editweight = true;
            return;
        }
    };

    $scope.isInEditMode = function(detail) {
        if (detail === "animalName")
            return $scope.$parent.currAnimal.editname;
        if (detail === "animalAge") 
            return $scope.$parent.currAnimal.editage;
        if (detail === "animalWeight")
            return $scope.$parent.currAnimal.editweight;
    };
    /* done editing button of simple detail of current animal was clicked : name/age/weight */
    $scope.doneEditClicked = function(detail) {
        var val,pre_val;
        if (detail === "animalName") {
            $scope.$parent.currAnimal.editname = false;
            val = $scope.$parent.currAnimal.animalName;
            pre_val = $scope.$parent.currAnimal.pre_name;
        }
        else if (detail === "animalAge") {
            $scope.$parent.currAnimal.editage = false;
            val = $scope.$parent.currAnimal.animalAge;
            pre_val = $scope.$parent.currAnimal.pre_age;
        } else if (detail === "animalWeight") {
            $scope.$parent.currAnimal.editweight = false;
            val = $scope.$parent.currAnimal.animalWeight;
            pre_val = $scope.$parent.currAnimal.pre_weight;
        }
        if (val !== pre_val) {
            console.log("doneEditClicked....");
            $http.get('http://localhost:3000/setAnimalField?field='+detail+'&animalId='+$scope.$parent.currAnimal._id+
                    '&animalNewVal='+val)
                    .success(function (data){
                        $scope.$parent.user = data;
                });
        } else 
                console.log("no need to update in db.");
    };
    /* add animal button was clicked */
    $scope.addNewAnimal = function() {
        $scope.$parent.newAnimalClicked = false;
        console.log("name: "+ $scope.animal.animalName);
        console.log("age: "+ $scope.animal.animalAge);
        console.log("weight: "+ $scope.animal.animalWeight);
        $scope.animal.animalPic = "animal1.png";
        console.log("pic: "+ $scope.animal.animalPic);

        $http.get('http://localhost:3000/setNewAnimal?animalName='+$scope.animal.animalName+'&animalAge='+$scope.animal.animalAge
            +'&animalWeight='+$scope.animal.animalWeight+'&animalPic='+$scope.animal.animalPic)
            .success(function (data){
                console.log("set new animal successfully...");
                console.log(data); 
                // update user with the new animal
                $scope.$parent.user = data;
                $scope.$parent.updateCurrentAnimal("last"); 
                $location.path("/animal");
        });
    };
    /* delete the current animal from animals of the user */
    $scope.deleteAnimal = function() {
        console.log("delete animal name :"+$scope.$parent.currAnimal.animalName);
        $http.get('http://localhost:3000/deleteAnimal?animalId='+$scope.$parent.currAnimal._id)
            .success(function (data){
                $scope.$parent.user = data;
                console.log(data);
                console.log($scope.$parent.currAnimal.animalName);
                // update new current animal because last current animal was deleted.
                $scope.$parent.updateCurrentAnimal("first");
        });
    };

    $scope.openVaccList = function(item){
        if ($scope.isVaccOpen(item)){
            $scope.$parent.currAnimal.vaccOpened = undefined;
        } else {
            // closing all open items vaccination in the list
            angular.forEach($scope.$parent.currAnimal.animalVaccination, function(vacc) {
                 vacc.vaccItemClickedVar = false;
            });
            $scope.resetVaccNewObj();
            $scope.addVaccClickedVar = false;
            $scope.$parent.currAnimal.vaccOpened = item;
        }        
    };
    $scope.openFoodList = function(item){
        if ($scope.isFoodOpen(item)){
            $scope.$parent.currAnimal.foodOpened = undefined;
        } else {
            // closing all open items food in the list
            angular.forEach($scope.$parent.currAnimal.animalFood, function(food) {
                 food.foodItemClickedVar = false;
            });
            $scope.resetFoodNewObj();
            $scope.addFoodClickedVar = false;
            $scope.$parent.currAnimal.foodOpened = item;
        }        
    };
    $scope.openCareList = function(item){
        if ($scope.isCareOpen(item)){
            $scope.$parent.currAnimal.careOpened = undefined;
        } else {
            // closing all open items care in the list
            angular.forEach($scope.$parent.currAnimal.animalCare, function(care) {
                 care.careItemClickedVar = false;
            });
            $scope.resetCareNewObj();
            $scope.addCareClickedVar = false;
            $scope.$parent.currAnimal.careOpened = item;
        }        
    };
    $scope.isVaccOpen = function(item){
        return $scope.$parent.currAnimal.vaccOpened === item;
    };
    $scope.isFoodOpen = function(item){
        return $scope.$parent.currAnimal.foodOpened === item;
    };
    $scope.isCareOpen = function(item){
        return $scope.$parent.currAnimal.careOpened === item;
    };
    $scope.vaccItemOpen = function() {
        return $scope.$parent.currAnimal.vaccOpened !== undefined;
    };
    $scope.foodItemOpen = function() {
        return $scope.$parent.currAnimal.foodOpened !== undefined;
    };
    $scope.careItemOpen = function() {
        return $scope.$parent.currAnimal.careOpened !== undefined;
    };
    $scope.closeVaccList = function() {
        $scope.$parent.currAnimal.vaccOpened = undefined;
    };
    $scope.closeFoodList = function() {
        $scope.$parent.currAnimal.foodOpened = undefined;
    };
    $scope.closeCareList = function() {
        $scope.$parent.currAnimal.careOpened = undefined;
    };
    $scope.addVaccClicked = function() {
        $scope.addVaccClickedVar = true;
    }
    $scope.addFoodClicked = function() {
        $scope.addFoodClickedVar = true;
    }
    $scope.addCareClicked = function() {
        $scope.addCareClickedVar = true;
    }
    $scope.addVaccState = function() {
        /* the form for a new vaccination will be shown in two cases:
            1. The list is empty.
            2. The add vacc button was clicked.
         */
        if ($scope.$parent.currAnimal.animalVaccination.length == 0 || $scope.addVaccClickedVar) 
            return true;
        return false;
    };
    $scope.addFoodState = function() {
        if ($scope.$parent.currAnimal.animalFood.length == 0 || $scope.addFoodClickedVar)
            return true;
        return false;
    };
    $scope.addCareState = function() {
        if ($scope.$parent.currAnimal.animalCare.length == 0 || $scope.addCareClickedVar)
            return true;
        return false;
    };
    $scope.createVacc = function (){
        var id = $scope.$parent.currAnimal._id; 
        $http.get('http://localhost:3000/addNewVacc?currAnimalId='+$scope.$parent.currAnimal._id
            +'&vaccName='+$scope.vacc.vaccName+'&vaccDate='+new Date($scope.vacc.vaccDate)
            +'&vaccExp='+new Date($scope.vacc.vaccExp))
            .success(function (data){
                $scope.$parent.user = data;
                $scope.$parent.checkSelectedAnimal(id);
                $scope.$parent.currAnimal.vaccOpened = "open";
                $scope.resetVaccNewObj();
                $scope.addVaccClickedVar = false;
        }); 
    };
    $scope.createFood = function (){
        var id = $scope.$parent.currAnimal._id; 
        $http.get('http://localhost:3000/addNewFood?currAnimalId='+$scope.$parent.currAnimal._id
            +'&foodName='+$scope.food.foodName+'&foodBrand='+$scope.food.foodBrand
            +'&foodBagWeight='+$scope.food.foodBagWeight+'&foodBagPrice='+$scope.food.foodBagPrice
            +'&foodDailyUsage='+$scope.food.foodDailyUsage+'&foodDate='+new Date($scope.food.foodDate))
            .success(function (data){
                $scope.$parent.user = data;
                $scope.$parent.checkSelectedAnimal(id);
                $scope.$parent.currAnimal.foodOpened = "open";
                $scope.resetFoodNewObj();
                $scope.addFoodClickedVar = false;
        }); 
    };
    $scope.createCare = function (){
        var id = $scope.$parent.currAnimal._id; 
        $http.get('http://localhost:3000/addNewCare?currAnimalId='+$scope.$parent.currAnimal._id
            +'&careType='+$scope.care.careType+'&careDate='+new Date($scope.care.careDate)
            +'&careExp='+new Date($scope.care.careExp))
            .success(function (data){
                $scope.$parent.user = data;
                $scope.$parent.checkSelectedAnimal(id);
                $scope.$parent.currAnimal.careOpened = "open";
                $scope.resetCareNewObj();
                $scope.addCareClickedVar = false;
        }); 
    };
    $scope.vaccItemClicked = function(vacc) {
        if (vacc.vaccItemClickedVar == true)
            vacc.vaccItemClickedVar = false;
        else 
            vacc.vaccItemClickedVar = true;
    }
    $scope.foodItemClicked = function(food) {
        if (food.foodItemClickedVar == true)
            food.foodItemClickedVar = false;
        else 
            food.foodItemClickedVar = true;
    }
    $scope.careItemClicked = function(care) {
        if (care.careItemClickedVar == true)
            care.careItemClickedVar = false;
        else 
            care.careItemClickedVar = true;
    }
    $scope.openList = function(typeList) {
        if (typeList == "vacc")
            $scope.openVaccList("open");
        else if (typeList == "food")
            $scope.openFoodList("open");
        else if(typeList == "care")
            $scope.openCareList("open");
    };
    $scope.deleteItemComplexDetail = function(typeComplexDetail,itemId) {
        var animalId = $scope.$parent.currAnimal._id; 
        console.log("delete item clicked");
        $http.get('http://localhost:3000/deleteItemComplexDetail?animalId='+animalId
            +'&typeComplexDetail='+typeComplexDetail+'&itemId='+itemId)
            .success(function (data){
                $scope.$parent.user = data;
                // update the current animal with the new list without the deleted item
                $scope.$parent.checkSelectedAnimal(animalId);
                // open back the list
                $scope.openList(typeComplexDetail);
        });
    };

}]); 

furrycareApp.controller('notificationCtrl', function ($scope,$http) {

    $scope.createNoti = function(notiType,notiName,notiReceivedDate,notiExpiredDate) {
        console.log("create notification to :"+notiType);
        console.log(notiName);
        // push the notification to db
        $http.get('http://localhost:3000/addNewNoti?animalId='+$scope.$parent.$parent.currAnimal._id
            +'&notiType='+notiType+'&notiName='+notiName
            +'&notiReceivedDate='+new Date(notiReceivedDate)+'&notiExpiredDate='+new Date(notiExpiredDate))
            .success(function (data){
                $scope.$parent.$parent.user = data;
        });
    };
    $scope.createFoodNoti = function(notiName,notiReceivedDate,bagWeight,dailyUse) {
        console.log("create notification to food.");
        var daysleft = (bagWeight * 1000) / dailyUse;
        var dateToExp = new Date();
        dateToExp.setDate(dateToExp.getDate() + daysleft); 
        console.log(dateToExp);
        // push the notification to db
        $http.get('http://localhost:3000/addNewNoti?animalId='+$scope.$parent.$parent.currAnimal._id
            +'&notiType=food'+'&notiName='+notiName
            +'&notiReceivedDate='+new Date(notiReceivedDate)+'&notiExpiredDate='+new Date(dateToExp))
            .success(function (data){
                $scope.$parent.$parent.user = data;
        });
    };
    /* calculate time left for care or vacc */
    $scope.calcTimeLeft = function (date,expDate) {
        var currentDate = new Date();
        var objDate = new Date(date);
        currentDate.setHours(0,0,0,0);
        objDate.setHours(0,0,0,0);

        var timeDiff = objDate.getTime() - currentDate.getTime();
        //var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 

        if (timeDiff > 0) {
            if (objDate.getFullYear() > currentDate.getFullYear())
                return (objDate.getFullYear() - currentDate.getFullYear())+" years";
            // (objDate.getFullYear() == currentDate.getFullYear()) 
            if ((objDate.getMonth()+1) > (currentDate.getMonth()+1))
                return ((objDate.getMonth()+1) - (currentDate.getMonth()+1))+" months";
            // ((objDate.getMonth+1) == (currentDate.getMonth+1))
            return (objDate.getDate() - currentDate.getDate())+" days";

        } else { // timeDiff <= 0 , the date is passed so we will check the expDate
            var exp = new Date(expDate);
            exp.setHours(0,0,0,0);
            timeDiff = exp.getTime() - currentDate.getTime();
            if (timeDiff < 0)
                return "";
            if (timeDiff == 0) 
                return "today";
            //timeDiff > 0
            if (exp.getFullYear() > currentDate.getFullYear())
                return (exp.getFullYear() - currentDate.getFullYear())+" years";
            // (exp.getFullYear() == currentDate.getFullYear()) 
            if ((exp.getMonth()+1) > (currentDate.getMonth()+1))
                return ((exp.getMonth()+1) - (currentDate.getMonth()+1))+" months";
            // ((exp.getMonth+1) == (currentDate.getMonth+1))
            return (exp.getDate() - currentDate.getDate())+" days";
        }
    };
    $scope.calcTimeLeftForFood = function(food) {
        var daysleft = (food.foodBagWeight * 1000) / food.foodDailyUsage;  
        var dateToExp = new Date(food.foodDate);
        dateToExp.setDate(dateToExp.getDate() + daysleft); 
        return $scope.calcTimeLeft(food.foodDate,dateToExp); 
    };
    $scope.calcTimeForNoti = function(notiType,notiReceivedDate,notiExpiredDate) {
        if (notiType == "food") {
            return $scope.calcTimeLeftForFood(notiType,notiReceivedDate,notiExpiredDate);
        } else // notiType is vacc or care
            return $scope.calcTimeLeft(notiReceivedDate,notiExpiredDate);
    };
    $scope.findAnimalNameById = function(animalId) {
        var nameFound = "";
        angular.forEach($scope.$parent.user.animals, function(animal) {
                if (animal._id == animalId) 
                    nameFound = animal.animalName;
        });
        return nameFound;
    };
    $scope.findAnimalImgById = function(animalId) {
        var imgFound = ""; // default img ?
        angular.forEach($scope.$parent.user.animals, function(animal) {
                if (animal._id == animalId) {
                    imgFound = animal.animalPic;
                }
        });
        return imgFound;
    };
    $scope.deleteNoti = function(notiId) {
        console.log("delete noti from app");
        console.log("noti id: "+notiId);
        $http.get('http://localhost:3000/deleteNoti?notiId='+notiId)
            .success(function (data){
                $scope.$parent.user = data;
        }); 
    };
    $scope.closestDate = function(date,exp) {
        var date = new Date(date);
        var currentDate = new Date();
        date.setHours(0,0,0,0);    
        currentDate.setHours(0,0,0,0);
        var diff1 = date.getTime() - currentDate.getTime();
        if (diff1 > 0)
            return date;
        return new Date(exp);
    }
    $scope.vaccOrder = function(vacc) {
        return $scope.closestDate(vacc.vaccDate,vacc.vaccExp);
    };
    $scope.careOrder = function(care) {
        return $scope.closestDate(care.careDate,care.careExp);
    };
    $scope.foodOrder = function(food) {
        var daysleft = (food.foodBagWeight * 1000) / food.foodDailyUsage;  
        var dateToExp = new Date(food.foodDate);
        dateToExp.setDate(dateToExp.getDate() + daysleft);
        return $scope.closestDate(food.foodDate,dateToExp);
    };
    $scope.notiOrder = function(noti) {
        return $scope.closestDate(noti.notiReceivedDate,noti.notiExpiredDate);
    };
});

