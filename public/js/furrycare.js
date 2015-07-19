var furrycareApp = angular.module("furrycareApp",['ngCookies','ngRoute','ngAnimate','puElasticInput']);

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

    $scope.page = 'notification';
    $("#login_btn_section").click(function () {
        $("#login_btn").trigger('click');
    });
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
        $http.get('https://furrycare-ws.herokuapp.com/getUser?userMail='+$cookies.userMail).success(function (data) {
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

        $http.get('https://furrycare-ws.herokuapp.com/getUser?userMail='+$scope.user.email)
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
                        $location.path("/notification");
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
        console.log("init user Ctrl..........................................");
        if ($scope.isUserLogedIn()) {
            $scope.getUser(); 
            $scope.newAnimalClicked = false;
            $location.path("/notification");
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
        $scope.updateCurrentAnimal("first");

        //$scope.user = $scope.getUser(); /// !!!! NEED TO THINK OF THAT
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
            $http.get('https://furrycare-ws.herokuapp.com/setAnimalField?field='+detail+'&animalId='+$scope.$parent.currAnimal._id+
                    '&animalNewVal='+val)
                    .success(function (data){
                        $scope.$parent.user = data;
                });
        } else 
                console.log("no need to update in db.");
    };
    /* add animal button was clicked */
    //$scope.addNewAnimal = function() {

    $scope.addNewAnimal = function(){
        $scope.$parent.newAnimalClicked = false;
        console.log("name: "+ $scope.animal.animalName);
        console.log("age: "+ $scope.animal.animalAge);
        console.log("weight: "+ $scope.animal.animalWeight);
        $scope.animal.animalPic = "images/animal1.png";
        console.log("pic: "+ $scope.animal.animalPic);

        if( profileImageUrl != null)
            $scope.animal.animalPic = profileImageUrl;
        
        console.log("pic: "+ $scope.animal.animalPic); // pic url;


        $http.get('https://furrycare-ws.herokuapp.com/setNewAnimal?animalName='+$scope.animal.animalName+'&animalAge='+$scope.animal.animalAge
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
        $http.get('https://furrycare-ws.herokuapp.com/deleteAnimal?animalId='+$scope.$parent.currAnimal._id)
            .success(function (data){
                $scope.$parent.user = data;
                console.log("return from delete server....");
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
        $http.get('https://furrycare-ws.herokuapp.com/addNewVacc?currAnimalId='+id
            +'&vaccName='+$scope.vacc.vaccName+'&vaccDate='+new Date($scope.vacc.vaccDate)
            +'&vaccExp='+new Date($scope.vacc.vaccExp))
            .success(function (data){
                $scope.$parent.user = data;
                $scope.$parent.checkSelectedAnimal(id);
                // find the last vaccination entered..
                var len = $scope.$parent.currAnimal.animalVaccination.length; 
                var vaccToNoti = $scope.$parent.currAnimal.animalVaccination[len-1];
                // broadcast to create notification with the inserted id of the vaccination
                $scope.$broadcast('createVaccNotiBroadcast', {vacc : vaccToNoti});
                $scope.$parent.currAnimal.vaccOpened = "open";
                $scope.resetVaccNewObj();
                $scope.addVaccClickedVar = false;
        }); 
    };
    $scope.createFood = function (){
        var id = $scope.$parent.currAnimal._id; 
        $http.get('https://furrycare-ws.herokuapp.com/addNewFood?currAnimalId='+id
            +'&foodName='+$scope.food.foodName+'&foodBrand='+$scope.food.foodBrand
            +'&foodBagWeight='+$scope.food.foodBagWeight+'&foodBagPrice='+$scope.food.foodBagPrice
            +'&foodDailyUsage='+$scope.food.foodDailyUsage+'&foodDate='+new Date($scope.food.foodDate))
            .success(function (data){
                $scope.$parent.user = data;
                $scope.$parent.checkSelectedAnimal(id);
                // find the last food entered..
                var len = $scope.$parent.currAnimal.animalFood.length; 
                var foodToNoti = $scope.$parent.currAnimal.animalFood[len-1];
                // broadcast to create notification with the inserted id of the food
                $scope.$broadcast('createFoodNotiBroadcast', {food : foodToNoti});
                $scope.$parent.currAnimal.foodOpened = "open";
                $scope.resetFoodNewObj();
                $scope.addFoodClickedVar = false;
        }); 
    };
    $scope.createCare = function (){
        var id = $scope.$parent.currAnimal._id; 
        $http.get('https://furrycare-ws.herokuapp.com/addNewCare?currAnimalId='+id
            +'&careType='+$scope.care.careType+'&careDate='+new Date($scope.care.careDate)
            +'&careExp='+new Date($scope.care.careExp))
            .success(function (data){
                $scope.$parent.user = data;
                $scope.$parent.checkSelectedAnimal(id);
                // find the last care entered..
                var len = $scope.$parent.currAnimal.animalCare.length; 
                var careToNoti = $scope.$parent.currAnimal.animalCare[len-1];
                // broadcast to create notification with the inserted id of the care
                $scope.$broadcast('createCareNotiBroadcast', {care : careToNoti});
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
        $http.get('https://furrycare-ws.herokuapp.com/deleteItemComplexDetail?animalId='+animalId
            +'&typeComplexDetail='+typeComplexDetail+'&itemId='+itemId)
            .success(function (data){
                $scope.$parent.user = data;
                // update the current animal with the new list without the deleted item
                $scope.$parent.checkSelectedAnimal(animalId);
                // open back the list
                $scope.openList(typeComplexDetail);
        });
    };



    var uploadAnimalPictureBool = 1;
    var profileImageUrl = null;


    $("#imgInp").change(function(){
        readURL(this);
    });

    $("#profileImage").click(function () {
        $("#imgInp").trigger('click');
    });
    $("#done_new_animal").click(function () {
        $("#submit_new_animal").trigger('click');
    });
    

    function readURL(input) {
        if (input.files && input.files[0]) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $('#profileImage').attr('src', e.target.result);
                console.log("temp url client:"+e.target.result);
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    $scope.uploadFile = function(files) {
        uploadAnimalPictureBool = 0; // block the user from submit
        var fd = new FormData();
        //Take the first selected file
        fd.append("file", files[0]);
        $http.post('https://furrycare-ws.herokuapp.com/uploadImg', fd, {
            withCredentials: true,
            headers: {'Content-Type': undefined},
            transformRequest: angular.identity
        }).success(function (data) {
            console.log("File Upload Succcess!!");
            uploadAnimalPictureBool = 1; // return the submit option
            console.log("this is image url:" + data);
            // add an extra to the url
            // this extra made the image size 50*50 and circle it
            ///c_scale,h_50,r_30,w_50
            var tempImageUrl = data;
            profileImageUrl = tempImageUrl.slice(0,48) + "/c_scale,h_60,r_30,w_60" + tempImageUrl.slice(48 + Math.abs(0));
            // change the image type to png (remove the image white background that create from circle the image)
            var urlLength = profileImageUrl.length;
            tempImageUrl = profileImageUrl;
            console.log("pro[]: "+profileImageUrl[urlLength-4]);
            if(profileImageUrl[urlLength-4]=="."){
                console.log("i am dot!");
                profileImageUrl = tempImageUrl.slice(0,urlLength-4) + ".png";
            } else if(profileImageUrl[urlLength-5]=="."){
                profileImageUrl = tempImageUrl.slice(0,urlLength-5) + ".png";
            }

            console.log("fixed url:" +profileImageUrl);

        })
            .error(function (err) {
                console.log("File Upload Error!!");
            });
    };

    $scope.checkIfAddAnimalAvailable = function(){
        // check if there is upload request - user cannot submit
      if (uploadAnimalPictureBool){
          // if uploading was finish you can submit the new animal
          $scope.addNewAnimal();
      }
        else{
          console.log("Please Wait for finish uploading the image");
          // need to implement some alert?
      }
    };

}]); 

furrycareApp.controller('notificationCtrl', function ($scope,$http,$filter) {

    $scope.$on('createVaccNotiBroadcast', function(event, data) { 
        var vacc = data.vacc;
        $scope.createNoti('vaccination',vacc._id,vacc.vaccName,vacc.vaccDate,vacc.vaccExp);
    });
    $scope.$on('createCareNotiBroadcast', function(event, data) { 
        var care = data.care;
        $scope.createNoti('care',care._id,care.careType,care.careDate,care.careExp);
    });
    $scope.$on('createFoodNotiBroadcast', function(event, data) { 
        var food = data.food;
        $scope.createFoodNoti(food._id,food.foodName,food.foodDate,food.foodBagWeight,food.foodDailyUsage);
    });
    
    $scope.createNoti = function(notiType,objId,notiName,notiReceivedDate,notiExpiredDate) {
        console.log("create notification to :"+notiType);
        console.log(notiName);
        // checking if notification is needed
        if ($scope.calcTimeLeftWithTwoDates(notiReceivedDate,notiExpiredDate) == "") {
            console.log("two entered dates is passed.")
            // do something ?
        } else {
            // push the notification to db
            $http.get('https://furrycare-ws.herokuapp.com/addNewNoti?animalId='+$scope.$parent.$parent.currAnimal._id
                +'&notiType='+notiType+'&objId='+objId+'&notiName='+notiName
                +'&notiReceivedDate='+new Date(notiReceivedDate)+'&notiExpiredDate='+new Date(notiExpiredDate))
                .success(function (data){
                    $scope.$parent.$parent.user = data;
                });
        }
    };
    $scope.createFoodNoti = function(foodId,notiName,notiReceivedDate,bagWeight,dailyUse) {
        console.log("create notification to food.");
        var daysleft = (bagWeight * 1000) / dailyUse;
        var dateToExp = new Date(notiReceivedDate);
        dateToExp.setDate(dateToExp.getDate() + daysleft); 
        // push the notification to db
        $http.get('https://furrycare-ws.herokuapp.com/addNewNoti?animalId='+$scope.$parent.$parent.currAnimal._id
            +'&notiType=food'+'&objId='+foodId+'&notiName='+notiName
            +'&notiReceivedDate='+new Date(notiReceivedDate)+'&notiExpiredDate='+new Date(dateToExp))
            .success(function (data){
                $scope.$parent.$parent.user = data;
        });
    };
    $scope.calcReturnTimeFromOneDate = function(date,currentDate) {
                var timeToReturn;
                timeToReturn = date.getFullYear() - currentDate.getFullYear();
                if (timeToReturn == 1)
                    return timeToReturn+" year"; // 1 year
                if (timeToReturn > 1)
                    return timeToReturn+" years";
                timeToReturn = (date.getMonth()+1) - (currentDate.getMonth()+1);
                if (timeToReturn == 1)
                    return timeToReturn+" month"; // 1 month
                if (timeToReturn > 1)
                    return timeToReturn+" months";
                timeToReturn = date.getDate() - currentDate.getDate();
                if (timeToReturn == 1)
                    return timeToReturn+" day"; // 1 day
                return timeToReturn+" days";
    };
    /* calculate time left for care or vacc */
    $scope.calcTimeLeftWithTwoDates = function (date,expDate) {
        var currentDate = new Date();
        var objDate = new Date(date);
        currentDate.setHours(0,0,0,0);
        objDate.setHours(0,0,0,0);

        var timeDiff = objDate.getTime() - currentDate.getTime();
        //var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
        var timeToReturn;
        if (timeDiff > 0) 
            return $scope.calcReturnTimeFromOneDate(objDate,currentDate);
        else { // timeDiff <= 0 , the date is passed so we will check the expDate
            var exp = new Date(expDate);
            exp.setHours(0,0,0,0);
            timeDiff = exp.getTime() - currentDate.getTime();
            if (timeDiff < 0)
                return "";
            if (timeDiff == 0) 
                return "today";
            //timeDiff > 0
            return $scope.calcReturnTimeFromOneDate(exp,currentDate);
        }
    };
    $scope.calcExpireDateForFood = function(food) {
        var daysleft = (food.foodBagWeight * 1000) / food.foodDailyUsage;  
        var dateToExp = new Date(food.foodDate);
        dateToExp.setDate(dateToExp.getDate() + daysleft);  
        return dateToExp;
    };
    $scope.calcTimeLeftForFood = function(food) {   
        return $scope.calcTimeLeftWithTwoDates(food.foodDate,$scope.calcExpireDateForFood(food)); 
    };
    $scope.calcTimeForNoti = function(notiReceivedDate,notiExpiredDate) {
        return $scope.calcTimeLeftWithTwoDates(notiReceivedDate,notiExpiredDate);
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
        $http.get('https://furrycare-ws.herokuapp.com/deleteNotiById?notiId='+notiId)
            .success(function (data){
                $scope.$parent.user = data;
        }); 
    };
    $scope.closestDate = function(date,exp) {
        var startDate = new Date(date);
        var currentDate = new Date();
        startDate.setHours(0,0,0,0);    
        currentDate.setHours(0,0,0,0);
        var diff1 = startDate.getTime() - currentDate.getTime();
        if (diff1 > 0)
            return startDate;
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
    $scope.createObjArrWithClosestDate = function(category) {
        if (category == "vacc") {
            var vaccArr = [];
            angular.forEach($scope.$parent.currAnimal.animalVaccination, function(vacc) {
                var vaccObj = {
                    vaccName: '',
                    closestDate: '' 
                };
                vaccObj.vaccName = vacc.vaccName;
                vaccObj.closestDate = new Date($scope.closestDate(vacc.vaccDate,vacc.vaccExp));
                vaccArr.push(vaccObj);
            });
            return vaccArr;
        }
        if (category == "food") {
            var foodArr = [];
            angular.forEach($scope.$parent.currAnimal.animalFood, function(food) {
                var foodObj = {
                    foodName: '',
                    closestDate: '' 
                };
                foodObj.foodName = food.foodName;
                foodObj.closestDate = new Date($scope.closestDate(food.foodDate,$scope.calcExpireDateForFood(food)));
                foodArr.push(foodObj);
            });
            return foodArr;
        }
        if (category == "care") {
            var careArr = [];
            angular.forEach($scope.$parent.currAnimal.animalCare, function(care) {
                var careObj = {
                    careType: '',
                    closestDate: '' 
                };
                careObj.careType = care.careType;
                careObj.closestDate = new Date($scope.closestDate(care.careDate,care.careExp));
                careArr.push(careObj);
            });
            return careArr;    
        }
    };
    $scope.saveImpObjOnScope = function(category,obj) {
        if (category == "vacc") {
            $scope.impVacc = obj;
            //console.log("imp vacc name: "+$scope.impVacc.vaccName);
        } else if (category == "food") {
            $scope.impFood = obj;
            //console.log("imp food name: "+$scope.impFood.foodName);
        } else if (category == "care") {
            $scope.impCare = obj;
            //console.log("imp care type: "+$scope.impCare.careType);
        }
    };
    $scope.findMostImportantItem = function(category) {
        var objArr = $scope.createObjArrWithClosestDate(category);
        console.log(objArr);
        var datesArr = $filter('orderBy')(objArr,'closestDate');
        var currentDate = new Date();
        currentDate.setHours(0,0,0,0);
        var found = 0;
        angular.forEach(datesArr, function(obj) {
            var date = new Date(obj.closestDate);
            date.setHours(0,0,0,0);
            var timeDiff = date.getTime() - currentDate.getTime(); 
            //console.log(timeDiff);
            if (timeDiff >= 0 && found == 0) {
                found = 1;
                $scope.saveImpObjOnScope(category,obj);
            }
        });
        return found;
    };
    $scope.getMessage1 = function(category) {
        if (category == "vaccination")
            return "Vaccine about to expire!";
        if (category == "food")
            return "Is running out";
        if (category == "care")
            return "The summer is comming";
    };
    $scope.getMessage2 = function(category) {
        if (category == "vaccination")
            return "";
        if (category == "food")
            return "It's time for a new one!";
        if (category == "care")
            return "It's time for an haircut!";    
    };

});

furrycareApp.controller('doneCtrl', function () {

        $("#done_new_vacc").click(function () {
            $("#submit_new_vacc").trigger('click');
        });
        
        $("#done_new_food").click(function () {
            $("#submit_new_food").trigger('click');
        });
        
        $("#done_new_care").click(function () {
            $("#submit_new_care").trigger('click');
        });
});

