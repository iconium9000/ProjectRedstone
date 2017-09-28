// clang++ -std=c++11 -stdlib=libc++ -Weverything fun_testing.cpp
// ./a.out


#include <iostream>
using namespace std;

#define loop(N,I,F) for (int I = 0; I < N; ++I) F;

int dt(int d, int v);
int gh(int n, int * a, int i = 0);
void flat_depth(int * a, int & c, int n, int d, int v);

int main(int argc, char ** argv) {
  if (argc < 3) {
    return -1;
  }

  int c = 0;
  const int n = stoi(argv[1]);
  const int v = stoi(argv[2]);
  int * a = new int[n];
  flat_depth(a, c, n, n, v);

  cout << endl;

  loop(15,i,{
    loop(15, j, cout << dt(i,j) << ' ')
    cout << endl;
  })
}

int dt(int d, int v) {
  return v < 1 ? 0 : d < 1 ? 1 : dt(d, v - 1) + dt(d - 1, v);
}

int gh(int n, int * a, int i) {
  return n > i ? dt(n - i, a[i]) + gh(n, a, i + 1) : 0;
}


void flat_depth(int * a, int & c, int n, int d, int v) {
  if (d > 0) {
    loop(v, i, {
      a[n - d] = i;
      flat_depth(a, c, n, d - 1, i + 1);
    })
  } else {
    cout << c++ << ": ";
    loop(n, i, cout << a[i] << ' ')
    cout << ": " << gh(n, a) << endl;
  }
}
