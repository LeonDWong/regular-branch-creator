## Description

Tool for creating a new formal regular git branch

## Usage

**create a new branch**
 
````shell
node bin/rgc.js create [yourprojectname]
````

> It will generate a branch which its format is {projectname}\_{YY-MM-DD}\_{timeStamp}

**delete a formal branch**

````shell
node bin/rgc.js delete [yourprojectname]
````

> It will delete a branch which its format is {projectname}\_{YY-MM-DD}\_{timeStamp}, and create a new tag which has the  same format, then push it to origin repository

**remove all local branch is not exist in remote branch any more**

````shell
node bin/rgc.js clean
````

> FTW