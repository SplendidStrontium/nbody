from numpy import zeros, dot, arange
import matplotlib.pyplot as plt
import math
import time

'''
HELPER CONSTANTS
'''
G = float("6.674e-11") #m^3*kg^-1*s^-2


'''
HELPER FUNCTIONS
'''
	
# ADJUST VELOCITY UP A HALF STEP
# (also leapfrog initial)
def vel_half():
	for i in range(N):
		accel()
		v[i] = v[i] + (1/2)*t_step*a[i]

# CALCULATE INIT JUP VELOCITY
def jup_init_vel():
	myval = (G * (m[0]+m[2])) / (4*dist_init)
	myval = myval * ((1-0.6)/(1+0.6))
	return math.sqrt(myval)
	
# CALCULATE POSITION 
def pos():
	for i in range(N):
		x[i] = x[i] + v[i]*t_step
		
# CALCULATE VELOCITY
def vel():
	for i in range(N):
		v[i] = v[i] + a[i]*t_step
	
# CALCULATE ACCELERATION GIVEN POSITION, MASS
def accel():
	for i in range(N):
		myval = zeros(2)
		for j in range(N):
			r = x[j] - x[i]
			if (i != j):
				myval += ((a[i] + r * G * m[j]) / (math.pow(dot(r,r), 1.5)))
		a[i] = myval
	
'''
END HELPER FUNCTIONS

BEGIN INITIAL CONDITIONS
'''
	
N = 3 # set number of particles here
t_step = float("10e5") #1.5 weeks
dist_init = float("1.5e11") #1 AU in meters
earth_speed_init = 29780 # avg orbital speed in m/s
jup_eccen = 0.6

# NOTE TWO DIMENSIONS ONLY
x = zeros([N,2]) # position matrix
v = zeros([N,2]) # velocity matrix
a = zeros([N,2]) # acceleration matrix
m = zeros(N)     # mass matrix

# INITIAL CONDITIONS
m[0] = 1.989e+30 # mass of sun in kg
m[1] = 5.972e+24 # mass of earth in kg
m[2] = 1.898e+27 # mass of jup in kg

x[0] = (0, 0)   # sun is in center
x[1] = (dist_init, 0) # earth is 1 AU to the right
x[2] = (-6.4*dist_init, 0) # jup is 4 AU * (1+e) to the left; e=0.6

jup_speed_init = jup_init_vel()
print(jup_speed_init)
v[1] = (0, -earth_speed_init) #earth init velocity is down in y direction
v[2] = (0, jup_speed_init) #jup init velocity is up in y direction

'''
END INITIAL CONDITIONS

BEGIN MAIN CODE
'''
iterations = 100000
fig1 = plt.figure()
plt.axis([-1e12, 1e12, -1e12, 1e12])
plt.ion()

vel_half()
plt.scatter(x[0,0], x[0,1])
plt.scatter(x[1,0], x[1,1])
plt.scatter(x[2,0], x[2,1])
print("if this takes too long, hit CTRL-C or exit plot to end plotting")

for i in range(iterations):
	pos()
	accel()
	vel()
	if (i % 50 == 0):
		plt.scatter(x[0,0], x[0,1])
		plt.scatter(x[1,0], x[1,1])
		plt.scatter(x[2,0], x[2,1])
		plt.draw()

plt.show()