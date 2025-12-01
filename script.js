// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form validation
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form inputs
        const name = this.querySelector('input[type="text"]').value.trim();
        const email = this.querySelector('input[type="email"]').value.trim();
        const message = this.querySelector('textarea').value.trim();

        // Basic validation
        if (!name || !email || !message) {
            alert('Please fill in all fields');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Simulate form submission
        alert('Thank you for your message! We will get back to you soon.');
        this.reset();
    });
}

// Add scroll-based navbar styling
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(44, 62, 80, 0.95)';
        } else {
            navbar.style.backgroundColor = '#2c3e50';
        }
    }
});

// Add animation to feature cards on scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(card);
});

// Add animation for process steps
const processObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, {
    threshold: 0.1
});

document.querySelectorAll('.process-step').forEach(step => {
    processObserver.observe(step);
});

// System Call Execution
const syscallData = {
    open: {
        userCode: `int fd = open("example.txt", O_RDONLY);
if (fd == -1) {
    perror("Error opening file");
    return -1;
}`,
        kernelCode: `SYSCALL_DEFINE2(open, const char __user *, filename, int, flags)
{
    // 1. Validate input parameters
    if (!filename)
        return -EFAULT;
    
    // 2. Check file permissions
    if (!may_open(AT_FDCWD, filename, flags, 0))
        return -EACCES;
    
    // 3. Allocate file descriptor
    int fd = get_unused_fd_flags(flags);
    if (fd < 0)
        return fd;
    
    // 4. Open the file
    struct file *f = do_filp_open(AT_FDCWD, filename, flags, 0);
    if (IS_ERR(f)) {
        put_unused_fd(fd);
        return PTR_ERR(f);
    }
    
    // 5. Install file descriptor
    fd_install(fd, f);
    return fd;
}`,
        steps: [
            "User application calls open() with filename and flags",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel checks file permissions",
            "Kernel allocates file descriptor",
            "Kernel opens the file",
            "Kernel installs file descriptor",
            "Return to user space with file descriptor"
        ]
    },
    read: {
        userCode: `char buffer[1024];
ssize_t bytes_read = read(fd, buffer, sizeof(buffer));
if (bytes_read == -1) {
    perror("Error reading file");
    return -1;
}`,
        kernelCode: `SYSCALL_DEFINE3(read, unsigned int, fd, char __user *, buf, size_t, count)
{
    // 1. Validate file descriptor
    struct fd f = fdget_pos(fd);
    if (!f.file)
        return -EBADF;
    
    // 2. Check read permissions
    if (!(f.file->f_mode & FMODE_READ))
        return -EBADF;
    
    // 3. Perform the read operation
    ssize_t ret = vfs_read(f.file, buf, count, &f.file->f_pos);
    
    // 4. Release file descriptor
    fdput_pos(f);
    return ret;
}`,
        steps: [
            "User application calls read() with file descriptor and buffer",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel validates file descriptor",
            "Kernel checks read permissions",
            "Kernel performs read operation",
            "Kernel copies data to user buffer",
            "Return to user space with bytes read"
        ]
    },
    write: {
        userCode: `const char *data = "Hello, World!";
ssize_t bytes_written = write(fd, data, strlen(data));
if (bytes_written == -1) {
    perror("Error writing to file");
    return -1;
}`,
        kernelCode: `SYSCALL_DEFINE3(write, unsigned int, fd, const char __user *, buf, size_t, count)
{
    // 1. Validate file descriptor
    struct fd f = fdget_pos(fd);
    if (!f.file)
        return -EBADF;
    
    // 2. Check write permissions
    if (!(f.file->f_mode & FMODE_WRITE))
        return -EBADF;
    
    // 3. Perform the write operation
    ssize_t ret = vfs_write(f.file, buf, count, &f.file->f_pos);
    
    // 4. Release file descriptor
    fdput_pos(f);
    return ret;
}`,
        steps: [
            "User application calls write() with file descriptor and data",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel validates file descriptor",
            "Kernel checks write permissions",
            "Kernel performs write operation",
            "Kernel copies data from user buffer",
            "Return to user space with bytes written"
        ]
    },
    fork: {
        userCode: `pid_t pid = fork();
if (pid == -1) {
    perror("Error creating process");
    return -1;
} else if (pid == 0) {
    // Child process
    printf("Child process (PID: %d)\\n", getpid());
} else {
    // Parent process
    printf("Parent process (PID: %d, Child PID: %d)\\n", getpid(), pid);
}`,
        kernelCode: `SYSCALL_DEFINE0(fork)
{
    // 1. Check process limits
    if (nr_threads >= max_threads)
        return -EAGAIN;
    
    // 2. Create new process
    struct task_struct *p = copy_process(CLONE_FORK, 0, 0, NULL, NULL, 0);
    if (IS_ERR(p))
        return PTR_ERR(p);
    
    // 3. Start the new process
    wake_up_new_task(p);
    
    // 4. Return child PID to parent, 0 to child
    return task_pid_vnr(p);
}`,
        steps: [
            "User application calls fork()",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel checks process limits",
            "Kernel creates new process",
            "Kernel copies parent process state",
            "Kernel starts new process",
            "Return to user space with appropriate PID"
        ]
    },
    exec: {
        userCode: `char *args[] = {"/bin/ls", "-l", NULL};
execvp(args[0], args);
perror("Error executing program");
return -1;`,
        kernelCode: `SYSCALL_DEFINE3(execve, const char __user *, filename,
    const char __user *const __user *, argv,
    const char __user *const __user *, envp)
{
    // 1. Validate parameters
    if (!filename || !argv || !envp)
        return -EFAULT;
    
    // 2. Load the new program
    struct linux_binprm *bprm = prepare_binprm(filename, argv, envp);
    if (IS_ERR(bprm))
        return PTR_ERR(bprm);
    
    // 3. Execute the program
    int ret = search_binary_handler(bprm);
    if (ret < 0)
        return ret;
    
    // 4. Clean up and return
    return 0;
}`,
        steps: [
            "User application calls exec() with program path and arguments",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel validates program path",
            "Kernel loads new program",
            "Kernel prepares execution environment",
            "Kernel starts new program",
            "Old program is replaced (no return)"
        ]
    },
    socket: {
        userCode: `int sockfd = socket(AF_INET, SOCK_STREAM, 0);
if (sockfd == -1) {
    perror("Error creating socket");
    return -1;
}`,
        kernelCode: `SYSCALL_DEFINE3(socket, int, family, int, type, int, protocol)
{
    // 1. Validate parameters
    if (family < 0 || family >= NPROTO)
        return -EAFNOSUPPORT;
    
    // 2. Create socket
    struct socket *sock;
    int ret = sock_create(family, type, protocol, &sock);
    if (ret < 0)
        return ret;
    
    // 3. Allocate file descriptor
    int fd = get_unused_fd_flags(O_RDWR);
    if (fd < 0) {
        sock_release(sock);
        return fd;
    }
    
    // 4. Install socket
    fd_install(fd, sock->file);
    return fd;
}`,
        steps: [
            "User application calls socket() with family, type, and protocol",
            "System call interface validates parameters",
            "Context switch to kernel mode",
            "Kernel validates socket parameters",
            "Kernel creates socket structure",
            "Kernel allocates file descriptor",
            "Kernel installs socket",
            "Return to user space with socket descriptor"
        ]
    }
};

let currentStep = 0;
let currentSyscall = null;

// System call controls
const runSyscallBtn = document.getElementById('run-syscall');
const stepForwardBtn = document.getElementById('step-forward');
const stepBackBtn = document.getElementById('step-back');

if (runSyscallBtn) {
    runSyscallBtn.addEventListener('click', () => {
        const select = document.getElementById('syscall-select');
        const selectedSyscall = select.value;

        if (!selectedSyscall) {
            alert('Please select a system call first');
            return;
        }

        currentSyscall = selectedSyscall;
        currentStep = 0;

        // Reset visualization
        document.getElementById('user-code').textContent = syscallData[selectedSyscall].userCode;
        document.getElementById('kernel-code').textContent = '';
        document.getElementById('execution-log').innerHTML = '';

        // Enable/disable controls
        stepBackBtn.disabled = true;
        stepForwardBtn.disabled = false;

        // Add first log entry
        addLogEntry(syscallData[selectedSyscall].steps[0]);
    });
}

if (stepForwardBtn) {
    stepForwardBtn.addEventListener('click', () => {
        if (!currentSyscall || currentStep >= syscallData[currentSyscall].steps.length - 1) return;

        currentStep++;

        // Update kernel code display
        if (currentStep >= 2) { // Start showing kernel code at step 3
            const kernelCode = syscallData[currentSyscall].kernelCode;
            const lines = kernelCode.split('\n');
            const visibleLines = lines.slice(0, currentStep - 1);
            document.getElementById('kernel-code').textContent = visibleLines.join('\n');
        }

        // Add log entry
        addLogEntry(syscallData[currentSyscall].steps[currentStep]);

        // Update controls
        stepBackBtn.disabled = false;
        if (currentStep >= syscallData[currentSyscall].steps.length - 1) {
            stepForwardBtn.disabled = true;
        }
    });
}

if (stepBackBtn) {
    stepBackBtn.addEventListener('click', () => {
        if (!currentSyscall || currentStep <= 0) return;

        currentStep--;

        // Update kernel code display
        if (currentStep >= 2) {
            const kernelCode = syscallData[currentSyscall].kernelCode;
            const lines = kernelCode.split('\n');
            const visibleLines = lines.slice(0, currentStep - 1);
            document.getElementById('kernel-code').textContent = visibleLines.join('\n');
        } else {
            document.getElementById('kernel-code').textContent = '';
        }

        // Remove last log entry
        const log = document.getElementById('execution-log');
        if (log.lastChild) {
            log.removeChild(log.lastChild);
        }

        // Update controls
        stepForwardBtn.disabled = false;
        if (currentStep <= 0) {
            stepBackBtn.disabled = true;
        }
    });
}